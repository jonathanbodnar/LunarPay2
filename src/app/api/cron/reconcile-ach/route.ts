/**
 * Scheduled ACH settlement reconcile.
 *
 * An ACH debit (POST /api/v1/charges with a bank account, recurring and
 * installment ACH, hosted checkout, payment links) is accepted by Fortis at
 * once and clears or comes back days later. Fortis transaction postbacks are
 * not registered for merchants, so nothing else ever looks again. This job
 * reads each waiting debit back from Fortis with the merchant's own
 * credentials, records the outcome, adjusts the donor's running totals, and
 * sends the merchant charge.succeeded / charge.failed — see
 * lib/fortis/ach-settlement.ts. Settled debits are re-checked about daily for
 * 75 days to catch a late return.
 *
 * GET|POST /api/cron/reconcile-ach?limit=&organizationId=&dryRun=1
 *   limit           max Fortis reads this run (default 100, max 500)
 *   organizationId  only this merchant
 *   dryRun=1        read Fortis and report what WOULD change — each transition
 *                   lists the webhooks it would queue (`events`) and whether a
 *                   subscription would be cancelled; writes nothing, not even
 *                   the run lock. Run it before scheduling.
 *
 * charge.succeeded / charge.failed go only to debits created through POST
 * /api/v1/charges or a renewal at or after ACH_CHARGE_EVENTS_SINCE; everything
 * else is reconciled without them. A subscription cancelled by a return is
 * always announced (subscription.cancelled) to a merchant with a webhook URL.
 *
 * Auth: `Authorization: Bearer <CRON_SECRET>`, `x-cron-secret: <CRON_SECRET>`,
 * or `?admin_key=<CRON_ADMIN_KEY>` for manual triggering.
 *
 * Schedule: hourly from Supabase pg_cron (the scheduler of record), with the
 * Railway cron service as a backstop — cron/README.md has the exact setup.
 * Safe to trigger from both schedulers: a run lease (job_locks) lets only one
 * run at a time, rows checked within ~2 hours are skipped, and every
 * transition is a conditional write, so it lands and is queued exactly once.
 */

import { createHash, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { runAchReconcile } from '@/lib/fortis/ach-settlement';
import { achSettlementDeps } from '@/lib/fortis/ach-settlement-runtime';

export const maxDuration = 60;

const MAX_LIMIT = 500;

/** Constant-time string comparison (hashing first makes the lengths equal). */
function secretMatches(provided: string | null, expected: string | undefined): boolean {
  if (!provided || !expected) return false;
  const a = createHash('sha256').update(provided).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

function isAuthorized(request: NextRequest, searchParams: URLSearchParams): boolean {
  const cronSecret = process.env.CRON_SECRET;
  const adminKey = process.env.CRON_ADMIN_KEY;

  const authHeader = request.headers.get('authorization');
  const cronHeader = request.headers.get('x-cron-secret');
  const queryAdminKey = searchParams.get('admin_key');

  if (cronSecret) {
    if (secretMatches(authHeader, `Bearer ${cronSecret}`) || secretMatches(authHeader, cronSecret)) return true;
    if (secretMatches(cronHeader, cronSecret)) return true;
  }
  if (adminKey && secretMatches(queryAdminKey, adminKey)) return true;

  return false;
}

function parsePositiveInt(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = parseInt(value, 10);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  if (!isAuthorized(request, searchParams)) {
    console.log('[RECONCILE_ACH] Unauthorized request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const organizationId = parsePositiveInt(searchParams.get('organizationId'));
  const requestedLimit = parsePositiveInt(searchParams.get('limit'));
  const limit = requestedLimit ? Math.min(requestedLimit, MAX_LIMIT) : undefined;
  const dryRun = ['1', 'true', 'yes'].includes((searchParams.get('dryRun') || '').toLowerCase());

  try {
    const summary = await runAchReconcile(achSettlementDeps(), { limit, organizationId, dryRun });

    if (!summary.ran) {
      console.log('[RECONCILE_ACH] Another run holds the lock; skipped');
      return NextResponse.json({ success: true, ...summary, timestamp: new Date().toISOString() });
    }

    console.log(
      `[RECONCILE_ACH]${dryRun ? ' (dry run)' : ''} outboxRetried=${summary.outboxRetried} selected=${summary.selected} checked=${summary.checked} ` +
        `transitioned=${summary.transitioned.length} unchanged=${summary.unchanged} skipped=${summary.skipped.length} ` +
        `errors=${summary.errors.length} deferred=${summary.deferred}` +
        (organizationId ? ` organizationId=${organizationId}` : '') +
        (summary.transitioned.length
          ? ` (${summary.transitioned
              .map((r) => `${r.organizationId}:${r.transactionId} ${r.from?.status}/${r.from?.statusAch ?? '-'}→${r.to?.status}/${r.to?.statusAch}${r.returnCode ? ` ${r.returnCode}` : ''}${r.subscriptionCancelled ? ' +subscription cancelled' : ''} → ${r.events?.length ? r.events.join(' + ') : 'not announced'}`)
              .join(', ')})`
          : '')
    );

    return NextResponse.json({
      success: true,
      ...summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[RECONCILE_ACH] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reconcile ACH transactions', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
