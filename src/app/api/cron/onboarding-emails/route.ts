/**
 * Onboarding Email Drip Sequence
 * 
 * Sends a 4-part email series to users who haven't completed Fortis onboarding:
 * - Email 1: 1 hour after registration (Welcome)
 * - Email 2: 24 hours after registration (The Story)
 * - Email 3: 72 hours after registration (The Explanation)
 * - Email 4: 14 days after registration (Re-engagement)
 * 
 * Schedule: Run every hour via Railway cron
 * 
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  sendOnboardingEmail1,
  sendOnboardingEmail2,
  sendOnboardingEmail3,
  sendOnboardingEmail4,
} from '@/lib/email';

// Admin key for manual triggering (must be set via environment variable)
const ADMIN_TRIGGER_KEY = process.env.CRON_ADMIN_KEY;

// Time thresholds in milliseconds
const ONE_HOUR = 60 * 60 * 1000;
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
const SEVENTY_TWO_HOURS = 72 * 60 * 60 * 1000;
const TWO_WEEKS = 14 * 24 * 60 * 60 * 1000;

interface EmailResult {
  email1: { sent: number; errors: number };
  email2: { sent: number; errors: number };
  email3: { sent: number; errors: number };
  email4: { sent: number; errors: number };
}

async function processOnboardingEmails(): Promise<EmailResult> {
  const now = new Date();
  const results: EmailResult = {
    email1: { sent: 0, errors: 0 },
    email2: { sent: 0, errors: 0 },
    email3: { sent: 0, errors: 0 },
    email4: { sent: 0, errors: 0 },
  };

  console.log('[ONBOARDING_EMAILS] Starting onboarding email processing at:', now.toISOString());

  // Get all incomplete onboardings that might need emails
  const incompleteOnboardings = await prisma.fortisOnboarding.findMany({
    where: {
      appStatus: {
        not: 'ACTIVE',
      },
    },
    include: {
      organization: {
        include: {
          user: true,
        },
      },
    },
  });

  console.log(`[ONBOARDING_EMAILS] Found ${incompleteOnboardings.length} incomplete onboardings to check`);

  for (const onboarding of incompleteOnboardings) {
    const user = onboarding.organization?.user;
    if (!user || !user.email) {
      console.log(`[ONBOARDING_EMAILS] Skipping onboarding ${onboarding.id} - no user or email`);
      continue;
    }

    const createdAt = new Date(onboarding.createdAt);
    const timeSinceCreation = now.getTime() - createdAt.getTime();
    const firstName = user.firstName || 'there';

    console.log(`[ONBOARDING_EMAILS] Checking user ${user.email}, created ${Math.round(timeSinceCreation / ONE_HOUR)} hours ago`);

    // Email 1: Send after 1 hour
    if (!onboarding.onboardingEmail1SentAt && timeSinceCreation >= ONE_HOUR) {
      console.log(`[ONBOARDING_EMAILS] Sending Email 1 to ${user.email}`);
      try {
        const sent = await sendOnboardingEmail1({ to: user.email, firstName });
        if (sent) {
          await prisma.fortisOnboarding.update({
            where: { id: onboarding.id },
            data: { onboardingEmail1SentAt: now },
          });
          results.email1.sent++;
          console.log(`[ONBOARDING_EMAILS] Email 1 sent successfully to ${user.email}`);
        } else {
          results.email1.errors++;
          console.log(`[ONBOARDING_EMAILS] Email 1 failed for ${user.email}`);
        }
      } catch (error) {
        results.email1.errors++;
        console.error(`[ONBOARDING_EMAILS] Error sending Email 1 to ${user.email}:`, error);
      }
    }

    // Email 2: Send after 24 hours
    if (!onboarding.onboardingEmail2SentAt && timeSinceCreation >= TWENTY_FOUR_HOURS) {
      console.log(`[ONBOARDING_EMAILS] Sending Email 2 to ${user.email}`);
      try {
        const sent = await sendOnboardingEmail2({ to: user.email, firstName });
        if (sent) {
          await prisma.fortisOnboarding.update({
            where: { id: onboarding.id },
            data: { onboardingEmail2SentAt: now },
          });
          results.email2.sent++;
          console.log(`[ONBOARDING_EMAILS] Email 2 sent successfully to ${user.email}`);
        } else {
          results.email2.errors++;
          console.log(`[ONBOARDING_EMAILS] Email 2 failed for ${user.email}`);
        }
      } catch (error) {
        results.email2.errors++;
        console.error(`[ONBOARDING_EMAILS] Error sending Email 2 to ${user.email}:`, error);
      }
    }

    // Email 3: Send after 72 hours (3 days)
    if (!onboarding.onboardingEmail3SentAt && timeSinceCreation >= SEVENTY_TWO_HOURS) {
      console.log(`[ONBOARDING_EMAILS] Sending Email 3 to ${user.email}`);
      try {
        const sent = await sendOnboardingEmail3({ to: user.email, firstName });
        if (sent) {
          await prisma.fortisOnboarding.update({
            where: { id: onboarding.id },
            data: { onboardingEmail3SentAt: now },
          });
          results.email3.sent++;
          console.log(`[ONBOARDING_EMAILS] Email 3 sent successfully to ${user.email}`);
        } else {
          results.email3.errors++;
          console.log(`[ONBOARDING_EMAILS] Email 3 failed for ${user.email}`);
        }
      } catch (error) {
        results.email3.errors++;
        console.error(`[ONBOARDING_EMAILS] Error sending Email 3 to ${user.email}:`, error);
      }
    }

    // Email 4: Send after 14 days (2 weeks)
    if (!onboarding.onboardingEmail4SentAt && timeSinceCreation >= TWO_WEEKS) {
      console.log(`[ONBOARDING_EMAILS] Sending Email 4 to ${user.email}`);
      try {
        const sent = await sendOnboardingEmail4({ to: user.email, firstName });
        if (sent) {
          await prisma.fortisOnboarding.update({
            where: { id: onboarding.id },
            data: { onboardingEmail4SentAt: now },
          });
          results.email4.sent++;
          console.log(`[ONBOARDING_EMAILS] Email 4 sent successfully to ${user.email}`);
        } else {
          results.email4.errors++;
          console.log(`[ONBOARDING_EMAILS] Email 4 failed for ${user.email}`);
        }
      } catch (error) {
        results.email4.errors++;
        console.error(`[ONBOARDING_EMAILS] Error sending Email 4 to ${user.email}:`, error);
      }
    }
  }

  console.log('[ONBOARDING_EMAILS] Processing complete:', JSON.stringify(results));
  return results;
}

// Allow both GET and POST for cron flexibility
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const adminKey = searchParams.get('admin_key');

  // Authorization: either CRON_SECRET header or admin_key query param
  const cronSecret = request.headers.get('x-cron-secret') || request.headers.get('authorization');
  const isAuthorized =
    cronSecret === process.env.CRON_SECRET ||
    cronSecret === `Bearer ${process.env.CRON_SECRET}` ||
    ADMIN_TRIGGER_KEY && adminKey === ADMIN_TRIGGER_KEY;

  if (!isAuthorized) {
    console.log('[ONBOARDING_EMAILS] Unauthorized request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results = await processOnboardingEmails();
    
    const totalSent = results.email1.sent + results.email2.sent + results.email3.sent + results.email4.sent;
    const totalErrors = results.email1.errors + results.email2.errors + results.email3.errors + results.email4.errors;

    return NextResponse.json({
      success: true,
      message: `Sent ${totalSent} emails with ${totalErrors} errors`,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[ONBOARDING_EMAILS] Error processing emails:', error);
    return NextResponse.json(
      { error: 'Failed to process onboarding emails', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
