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
 *   dryRun=1        read Fortis and report what WOULD change; writes and sends nothing
 *
 * Auth: `Authorization: Bearer <CRON_SECRET>`, `x-cron-secret: <CRON_SECRET>`,
 * or `?admin_key=<CRON_ADMIN_KEY>` for manual triggering.
 *
 * Schedule: hourly from Supabase pg_cron (the scheduler of record), with the
 * Railway cron service as a backstop — cron/README.md has the exact setup.
 * Safe to run concurrently or repeatedly: every transition is a conditional
 * write, so it lands and is announced exactly once.
 */

import { NextRequest, NextResponse } from 'next/server';
import { runAchReconcile } from '@/lib/fortis/ach-settlement';
import { achSettlementDeps } from '@/lib/fortis/ach-settlement-runtime';

export const maxDuration = 60;

const MAX_LIMIT = 500;

function isAuthorized(request: NextRequest, searchParams: URLSearchParams): boolean {
  const cronSecret = process.env.CRON_SECRET;
  const adminKey = process.env.CRON_ADMIN_KEY;

  const authHeader = request.headers.get('authorization');
  const cronHeader = request.headers.get('x-cron-secret');
  const queryAdminKey = searchParams.get('admin_key');

  if (cronSecret) {
    if (authHeader === `Bearer ${cronSecret}` || authHeader === cronSecret) return true;
    if (cronHeader === cronSecret) return true;
  }
  if (adminKey && queryAdminKey === adminKey) return true;

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

    console.log(
      `[RECONCILE_ACH]${dryRun ? ' (dry run)' : ''} selected=${summary.selected} checked=${summary.checked} ` +
        `transitioned=${summary.transitioned.length} unchanged=${summary.unchanged} skipped=${summary.skipped.length} ` +
        `errors=${summary.errors.length} deferred=${summary.deferred}` +
        (organizationId ? ` organizationId=${organizationId}` : '') +
        (summary.transitioned.length
          ? ` (${summary.transitioned
              .map((r) => `${r.organizationId}:${r.transactionId} ${r.from?.status}/${r.from?.statusAch ?? '-'}→${r.to?.status}/${r.to?.statusAch} ${r.event}${r.returnCode ? ` ${r.returnCode}` : ''}`)
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
