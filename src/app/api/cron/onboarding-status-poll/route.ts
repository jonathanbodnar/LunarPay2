/**
 * Poll Fortis for agency merchants whose application is still in flight.
 *
 * Fortis's approval webhook is a single push. When one is missed the merchant
 * sits in BANK_INFORMATION_SENT indefinitely while Fortis considers them live,
 * and the agency has no way to find out — the blind window between "submitted"
 * and "approved" had no other signal at all.
 *
 * This closes it from our side: anything still in flight is re-checked against
 * Fortis, and a merchant that has since been approved is activated and the
 * agency notified with the same `merchant.approved` payload the webhook would
 * have sent (including the merchant's API keys).
 *
 * Scoped to agency merchants because they are the ones whose approval another
 * system is waiting on. Self-serve merchants see their status in the dashboard.
 *
 * Supports ?dry_run=1 to report what would change without writing.
 */

import { NextRequest, NextResponse, after } from 'next/server';
import { prisma } from '@/lib/prisma';
import { reconcileOnboardingFromFortis } from '@/lib/fortis/reconcile-onboarding';
import { notifyAgencyOfStatusChange } from '@/lib/agency-webhook';

/** Statuses that mean "Fortis has it and hasn't finished". */
const IN_FLIGHT = ['BANK_INFORMATION_SENT', 'PENDING_REVIEW'];

/** Bounded so one run can't fan out into an unbounded number of Fortis calls. */
const MAX_PER_RUN = 40;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isVercelCron = !!request.headers.get('x-vercel-cron');
  const cronSecret = request.headers.get('x-cron-secret') || request.headers.get('authorization');
  const adminKey = searchParams.get('admin_key');

  const isAuthorized =
    isVercelCron ||
    cronSecret === process.env.CRON_SECRET ||
    cronSecret === `Bearer ${process.env.CRON_SECRET}` ||
    (process.env.CRON_ADMIN_KEY && adminKey === process.env.CRON_ADMIN_KEY);

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dryRun = searchParams.get('dry_run') === '1' || searchParams.get('dry_run') === 'true';

  try {
    const inFlight = await prisma.fortisOnboarding.findMany({
      where: {
        appStatus: { in: IN_FLIGHT },
        organization: { user: { agencyId: { not: null } } },
      },
      select: {
        organizationId: true,
        appStatus: true,
        organization: { select: { userId: true, name: true } },
      },
      orderBy: { updatedAt: 'asc' },
      take: MAX_PER_RUN,
    });

    const checked: Array<{
      organizationId: number;
      business: string | null;
      from: string | null;
      to: string | null;
      changed: boolean;
      reason: string;
    }> = [];

    for (const row of inFlight) {
      if (dryRun) {
        checked.push({
          organizationId: row.organizationId,
          business: row.organization?.name ?? null,
          from: row.appStatus,
          to: null,
          changed: false,
          reason: 'dry run — not checked against Fortis',
        });
        continue;
      }

      const result = await reconcileOnboardingFromFortis(row.organizationId);

      checked.push({
        organizationId: row.organizationId,
        business: row.organization?.name ?? null,
        from: result.previousStatus,
        to: result.newStatus,
        changed: result.changed,
        reason: result.reason,
      });

      if (result.changed && result.newStatus === 'ACTIVE' && row.organization?.userId) {
        const userId = row.organization.userId;
        const orgId = row.organizationId;
        const prev = result.previousStatus;
        // Deferred so the delivery retry backoff outlives this response.
        after(() => notifyAgencyOfStatusChange(userId, orgId, 'ACTIVE', prev));
        console.log(`[ONBOARDING_POLL] Activated org ${orgId} and notified its agency`);
      }
    }

    const activated = checked.filter((c) => c.changed).length;

    return NextResponse.json({
      success: true,
      dryRun,
      inFlight: inFlight.length,
      activated,
      ...(inFlight.length === MAX_PER_RUN
        ? { note: `Capped at ${MAX_PER_RUN} per run` }
        : {}),
      checked,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[ONBOARDING_POLL] Error:', error);
    return NextResponse.json(
      { error: 'Failed to poll onboarding status', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
