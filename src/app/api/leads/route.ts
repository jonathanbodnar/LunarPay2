import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
      // Update the timestamp so we know they came back
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
        source: source || 'website',
      },
    });

    return NextResponse.json({ success: true, status: 'captured' });
  } catch (error) {
    console.error('[Leads] Error capturing lead:', error);
    return NextResponse.json(
      { error: 'Failed to capture lead' },
      { status: 500 }
    );
  }
}
