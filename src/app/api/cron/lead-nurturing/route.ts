/**
 * Lead Nurturing Email Drip Sequence
 * 
 * Sends a 6-part email series to leads who haven't registered:
 * - Email 1: Immediately (The Hook + Pricing)
 * - Email 2: 24 hours (Jonathan's Stripe Story)
 * - Email 3: 3 days (The Deplatforming Pattern)
 * - Email 4: 5 days (How LunarPay is Different)
 * - Email 5: 8 days (What's Your Backup Plan)
 * - Email 6: 12 days (Final / Breakup Email)
 * 
 * Stops automatically when a lead registers (converted = true).
 * 
 * Schedule: Run every hour via pg_cron
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  sendLeadNurturingEmail1,
  sendLeadNurturingEmail2,
  sendLeadNurturingEmail3,
  sendLeadNurturingEmail4,
  sendLeadNurturingEmail5,
  sendLeadNurturingEmail6,
} from '@/lib/email';

const ADMIN_TRIGGER_KEY = process.env.CRON_ADMIN_KEY;

// Time thresholds in milliseconds
const IMMEDIATELY = 0;
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
const FIVE_DAYS = 5 * 24 * 60 * 60 * 1000;
const EIGHT_DAYS = 8 * 24 * 60 * 60 * 1000;
const TWELVE_DAYS = 12 * 24 * 60 * 60 * 1000;

interface EmailResult {
  email1: { sent: number; errors: number };
  email2: { sent: number; errors: number };
  email3: { sent: number; errors: number };
  email4: { sent: number; errors: number };
  email5: { sent: number; errors: number };
  email6: { sent: number; errors: number };
}

async function processLeadNurturingEmails(): Promise<EmailResult> {
  const now = new Date();
  const results: EmailResult = {
    email1: { sent: 0, errors: 0 },
    email2: { sent: 0, errors: 0 },
    email3: { sent: 0, errors: 0 },
    email4: { sent: 0, errors: 0 },
    email5: { sent: 0, errors: 0 },
    email6: { sent: 0, errors: 0 },
  };

  console.log('[LEAD_NURTURING] Starting lead nurturing email processing at:', now.toISOString());

  // Get all unconverted leads that might need emails
  const unconvertedLeads = await prisma.lead.findMany({
    where: {
      converted: false,
    },
  });

  console.log(`[LEAD_NURTURING] Found ${unconvertedLeads.length} unconverted leads to check`);

  for (const lead of unconvertedLeads) {
    // Double-check: skip if this email has already registered as a user
    const existingUser = await prisma.user.findUnique({
      where: { email: lead.email },
      select: { id: true },
    });

    if (existingUser) {
      // Mark as converted and skip
      await prisma.lead.update({
        where: { id: lead.id },
        data: { converted: true, convertedAt: now },
      });
      console.log(`[LEAD_NURTURING] Lead ${lead.email} already registered, marking converted`);
      continue;
    }

    const createdAt = new Date(lead.createdAt);
    const timeSinceCreation = now.getTime() - createdAt.getTime();

    // Email 1: Immediately
    if (!lead.nurturingEmail1SentAt && timeSinceCreation >= IMMEDIATELY) {
      console.log(`[LEAD_NURTURING] Sending Email 1 to ${lead.email}`);
      try {
        const sent = await sendLeadNurturingEmail1({ to: lead.email });
        if (sent) {
          await prisma.lead.update({
            where: { id: lead.id },
            data: { nurturingEmail1SentAt: now },
          });
          results.email1.sent++;
        } else {
          results.email1.errors++;
        }
      } catch (error) {
        results.email1.errors++;
        console.error(`[LEAD_NURTURING] Error sending Email 1 to ${lead.email}:`, error);
      }
    }

    // Email 2: 24 hours
    if (!lead.nurturingEmail2SentAt && timeSinceCreation >= TWENTY_FOUR_HOURS) {
      console.log(`[LEAD_NURTURING] Sending Email 2 to ${lead.email}`);
      try {
        const sent = await sendLeadNurturingEmail2({ to: lead.email });
        if (sent) {
          await prisma.lead.update({
            where: { id: lead.id },
            data: { nurturingEmail2SentAt: now },
          });
          results.email2.sent++;
        } else {
          results.email2.errors++;
        }
      } catch (error) {
        results.email2.errors++;
        console.error(`[LEAD_NURTURING] Error sending Email 2 to ${lead.email}:`, error);
      }
    }

    // Email 3: 3 days
    if (!lead.nurturingEmail3SentAt && timeSinceCreation >= THREE_DAYS) {
      console.log(`[LEAD_NURTURING] Sending Email 3 to ${lead.email}`);
      try {
        const sent = await sendLeadNurturingEmail3({ to: lead.email });
        if (sent) {
          await prisma.lead.update({
            where: { id: lead.id },
            data: { nurturingEmail3SentAt: now },
          });
          results.email3.sent++;
        } else {
          results.email3.errors++;
        }
      } catch (error) {
        results.email3.errors++;
        console.error(`[LEAD_NURTURING] Error sending Email 3 to ${lead.email}:`, error);
      }
    }

    // Email 4: 5 days
    if (!lead.nurturingEmail4SentAt && timeSinceCreation >= FIVE_DAYS) {
      console.log(`[LEAD_NURTURING] Sending Email 4 to ${lead.email}`);
      try {
        const sent = await sendLeadNurturingEmail4({ to: lead.email });
        if (sent) {
          await prisma.lead.update({
            where: { id: lead.id },
            data: { nurturingEmail4SentAt: now },
          });
          results.email4.sent++;
        } else {
          results.email4.errors++;
        }
      } catch (error) {
        results.email4.errors++;
        console.error(`[LEAD_NURTURING] Error sending Email 4 to ${lead.email}:`, error);
      }
    }

    // Email 5: 8 days
    if (!lead.nurturingEmail5SentAt && timeSinceCreation >= EIGHT_DAYS) {
      console.log(`[LEAD_NURTURING] Sending Email 5 to ${lead.email}`);
      try {
        const sent = await sendLeadNurturingEmail5({ to: lead.email });
        if (sent) {
          await prisma.lead.update({
            where: { id: lead.id },
            data: { nurturingEmail5SentAt: now },
          });
          results.email5.sent++;
        } else {
          results.email5.errors++;
        }
      } catch (error) {
        results.email5.errors++;
        console.error(`[LEAD_NURTURING] Error sending Email 5 to ${lead.email}:`, error);
      }
    }

    // Email 6: 12 days
    if (!lead.nurturingEmail6SentAt && timeSinceCreation >= TWELVE_DAYS) {
      console.log(`[LEAD_NURTURING] Sending Email 6 to ${lead.email}`);
      try {
        const sent = await sendLeadNurturingEmail6({ to: lead.email });
        if (sent) {
          await prisma.lead.update({
            where: { id: lead.id },
            data: { nurturingEmail6SentAt: now },
          });
          results.email6.sent++;
        } else {
          results.email6.errors++;
        }
      } catch (error) {
        results.email6.errors++;
        console.error(`[LEAD_NURTURING] Error sending Email 6 to ${lead.email}:`, error);
      }
    }
  }

  console.log('[LEAD_NURTURING] Processing complete:', JSON.stringify(results));
  return results;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const adminKey = searchParams.get('admin_key');

  const cronSecret = request.headers.get('x-cron-secret') || request.headers.get('authorization');
  const isAuthorized =
    cronSecret === process.env.CRON_SECRET ||
    cronSecret === `Bearer ${process.env.CRON_SECRET}` ||
    (ADMIN_TRIGGER_KEY && adminKey === ADMIN_TRIGGER_KEY);

  if (!isAuthorized) {
    console.log('[LEAD_NURTURING] Unauthorized request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results = await processLeadNurturingEmails();

    const totalSent = Object.values(results).reduce((sum, r) => sum + r.sent, 0);
    const totalErrors = Object.values(results).reduce((sum, r) => sum + r.errors, 0);

    return NextResponse.json({
      success: true,
      message: `Sent ${totalSent} lead nurturing emails with ${totalErrors} errors`,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[LEAD_NURTURING] Error processing emails:', error);
    return NextResponse.json(
      { error: 'Failed to process lead nurturing emails', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
