import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Send lead to webhook (fire-and-forget)
 */
async function sendToWebhook(email: string, source: string) {
  const webhookUrl = process.env.LEADS_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        source,
        timestamp: new Date().toISOString(),
      }),
    });
    console.log('[Leads] Webhook sent for:', email);
  } catch (err) {
    console.error('[Leads] Webhook failed:', err);
  }
}

/**
 * POST /api/leads - Capture a lead email (public, no auth required)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, source } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const leadSource = source || 'website';

    // Always send to webhook (even if DB fails)
    sendToWebhook(normalizedEmail, leadSource).catch(() => {});

    // Try to save to database (may fail if table doesn't exist yet)
    try {
      // Check if this email already exists as a registered user
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        return NextResponse.json({ success: true, status: 'already_registered' });
      }

      // Check if lead already exists
      const existingLead = await prisma.lead.findFirst({
        where: { email: normalizedEmail },
      });

      if (existingLead) {
        await prisma.lead.update({
          where: { id: existingLead.id },
          data: { updatedAt: new Date() },
        });
        return NextResponse.json({ success: true, status: 'updated' });
      }

      // Create new lead
      await prisma.lead.create({
        data: {
          email: normalizedEmail,
          source: leadSource,
        },
      });

      return NextResponse.json({ success: true, status: 'captured' });
    } catch (dbError) {
      console.error('[Leads] DB error (webhook was still sent):', dbError);
      // Still return success since webhook was sent
      return NextResponse.json({ success: true, status: 'webhook_only' });
    }
  } catch (error) {
    console.error('[Leads] Error capturing lead:', error);
    return NextResponse.json(
      { error: 'Failed to capture lead' },
      { status: 500 }
    );
  }
}
