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
const ONE_DAY = 24 * 60 * 60 * 1000;

/**
 * How long after an email becomes due it may still be sent.
 *
 * This drip stopped running in March 2026. Without a window, the first run
 * after it came back would have treated every dormant signup as newly due and
 * sent the entire sequence at once — 92 emails to 35 merchants, including
 * "welcome, you registered an hour ago" to accounts from January. A stalled
 * cron must not turn into a mass mailing the moment it recovers.
 *
 * Anything past its window is marked as sent-by-skip so it is never revisited.
 */
const SEND_WINDOW = 3 * ONE_DAY;

/**
 * Most emails a single run may send, across all merchants. A backstop against
 * any future gap in cron coverage; normal daily volume is a handful.
 */
const MAX_SENDS_PER_RUN = 25;

interface DripStep {
  n: 1 | 2 | 3 | 4;
  dueAfter: number;
  sentAtField: 'onboardingEmail1SentAt' | 'onboardingEmail2SentAt' | 'onboardingEmail3SentAt' | 'onboardingEmail4SentAt';
}

const DRIP_STEPS: DripStep[] = [
  { n: 1, dueAfter: ONE_HOUR, sentAtField: 'onboardingEmail1SentAt' },
  { n: 2, dueAfter: TWENTY_FOUR_HOURS, sentAtField: 'onboardingEmail2SentAt' },
  { n: 3, dueAfter: SEVENTY_TWO_HOURS, sentAtField: 'onboardingEmail3SentAt' },
  { n: 4, dueAfter: TWO_WEEKS, sentAtField: 'onboardingEmail4SentAt' },
];

interface EmailResult {
  email1: { sent: number; errors: number };
  email2: { sent: number; errors: number };
  email3: { sent: number; errors: number };
  email4: { sent: number; errors: number };
  /** Past their send window — marked done without mailing. */
  skippedStale: number;
  /** Deferred because the per-run cap was reached. */
  deferredByCap: number;
  dryRun: boolean;
}

async function processOnboardingEmails(dryRun = false): Promise<EmailResult> {
  const now = new Date();
  const results: EmailResult = {
    email1: { sent: 0, errors: 0 },
    email2: { sent: 0, errors: 0 },
    email3: { sent: 0, errors: 0 },
    email4: { sent: 0, errors: 0 },
    skippedStale: 0,
    deferredByCap: 0,
    dryRun,
  };

  const senders = {
    1: sendOnboardingEmail1,
    2: sendOnboardingEmail2,
    3: sendOnboardingEmail3,
    4: sendOnboardingEmail4,
  } as const;

  console.log(
    `[ONBOARDING_EMAILS] Starting at ${now.toISOString()}${dryRun ? ' (DRY RUN — nothing will be sent)' : ''}`
  );

  // Get all incomplete onboardings that might need emails (exclude agency merchants)
  const incompleteOnboardings = await prisma.fortisOnboarding.findMany({
    where: {
      appStatus: {
        not: 'ACTIVE',
      },
      organization: {
        user: {
          agencyId: null,
        },
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

  let sendsThisRun = 0;

  for (const onboarding of incompleteOnboardings) {
    const user = onboarding.organization?.user;
    if (!user || !user.email) {
      console.log(`[ONBOARDING_EMAILS] Skipping onboarding ${onboarding.id} - no user or email`);
      continue;
    }

    const createdAt = new Date(onboarding.createdAt);
    const age = now.getTime() - createdAt.getTime();
    const firstName = user.firstName || 'there';

    // Earliest unsent step that is due. At most ONE email per merchant per run:
    // the four steps used to be independent `if` blocks, so a merchant who had
    // never been mailed received all four in the same pass.
    const step = DRIP_STEPS.find((s) => !onboarding[s.sentAtField] && age >= s.dueAfter);
    if (!step) continue;

    const bucket = results[`email${step.n}` as 'email1' | 'email2' | 'email3' | 'email4'];

    // Too late to be honest about. Stamp it so this record stops being a
    // candidate forever, but send nothing.
    if (age > step.dueAfter + SEND_WINDOW) {
      results.skippedStale++;
      console.log(
        `[ONBOARDING_EMAILS] Stale: ${user.email} email ${step.n} was due ` +
          `${Math.round((age - step.dueAfter) / ONE_DAY)}d ago — marking skipped, not sending`
      );
      if (!dryRun) {
        await prisma.fortisOnboarding.update({
          where: { id: onboarding.id },
          data: { [step.sentAtField]: now },
        });
      }
      continue;
    }

    if (sendsThisRun >= MAX_SENDS_PER_RUN) {
      results.deferredByCap++;
      continue;
    }

    console.log(`[ONBOARDING_EMAILS] Sending Email ${step.n} to ${user.email}`);

    if (dryRun) {
      bucket.sent++;
      sendsThisRun++;
      continue;
    }

    try {
      const sent = await senders[step.n]({ to: user.email, firstName });
      if (sent) {
        await prisma.fortisOnboarding.update({
          where: { id: onboarding.id },
          data: { [step.sentAtField]: now },
        });
        bucket.sent++;
        sendsThisRun++;
        console.log(`[ONBOARDING_EMAILS] Email ${step.n} sent successfully to ${user.email}`);
      } else {
        bucket.errors++;
        console.log(`[ONBOARDING_EMAILS] Email ${step.n} failed for ${user.email}`);
      }
    } catch (error) {
      bucket.errors++;
      console.error(`[ONBOARDING_EMAILS] Error sending Email ${step.n} to ${user.email}:`, error);
    }
  }

  console.log('[ONBOARDING_EMAILS] Processing complete:', JSON.stringify(results));
  return results;
}

// Allow both GET and POST for cron flexibility
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const adminKey = searchParams.get('admin_key');

  // Authorization: Vercel native cron, CRON_SECRET header, or admin_key query param
  const isVercelCron = !!request.headers.get('x-vercel-cron');
  const cronSecret = request.headers.get('x-cron-secret') || request.headers.get('authorization');
  const isAuthorized =
    isVercelCron ||
    cronSecret === process.env.CRON_SECRET ||
    cronSecret === `Bearer ${process.env.CRON_SECRET}` ||
    (ADMIN_TRIGGER_KEY && adminKey === ADMIN_TRIGGER_KEY);

  if (!isAuthorized) {
    console.log('[ONBOARDING_EMAILS] Unauthorized request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // ?dry_run=1 reports exactly what a real run would do without sending or
    // writing anything. Use it first after any gap in cron coverage.
    const dryRun = searchParams.get('dry_run') === '1' || searchParams.get('dry_run') === 'true';

    const results = await processOnboardingEmails(dryRun);

    const totalSent = results.email1.sent + results.email2.sent + results.email3.sent + results.email4.sent;
    const totalErrors = results.email1.errors + results.email2.errors + results.email3.errors + results.email4.errors;

    return NextResponse.json({
      success: true,
      message: dryRun
        ? `DRY RUN: would send ${totalSent} emails, skip ${results.skippedStale} as stale`
        : `Sent ${totalSent} emails with ${totalErrors} errors (${results.skippedStale} skipped as stale)`,
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
