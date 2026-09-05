/**
 * Scheduled Fortis onboarding reconciliation.
 *
 * Fortis has no endpoint to read an application's status and delivers merchant
 * credentials only by webhook, so this job replays stored-but-unapplied
 * webhooks and detects approvals through GET /v1/users for every submitted,
 * non-terminal onboarding record (see lib/fortis/onboarding-sync.ts).
 *
 * GET|POST /api/cron/sync-onboarding-status?organizationId=&limit=
 *
 * Auth: `Authorization: Bearer <CRON_SECRET>`, `x-cron-secret: <CRON_SECRET>`,
 * or `?admin_key=<CRON_ADMIN_KEY>` for manual triggering.
 *
 * Schedule: run every 30-60 minutes via Railway cron.
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncAllPendingOnboardings } from '@/lib/fortis/onboarding-sync';

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
    console.log('[SYNC_ONBOARDING_STATUS] Unauthorized request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const organizationId = parsePositiveInt(searchParams.get('organizationId'));
  const requestedLimit = parsePositiveInt(searchParams.get('limit'));
  const limit = requestedLimit ? Math.min(requestedLimit, MAX_LIMIT) : undefined;

  try {
    const summary = await syncAllPendingOnboardings({ limit, organizationId });

    console.log(
      `[SYNC_ONBOARDING_STATUS] checked=${summary.checked} changed=${summary.changed.length} unchanged=${summary.unchanged} errors=${summary.errors.length}` +
        (organizationId ? ` organizationId=${organizationId}` : '') +
        (summary.changed.length
          ? ` (${summary.changed.map((r) => `${r.organizationId}:${r.previousStatus}→${r.status}`).join(', ')})`
          : '')
    );

    return NextResponse.json({
      success: true,
      checked: summary.checked,
      changed: summary.changed,
      unchanged: summary.unchanged,
      errors: summary.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[SYNC_ONBOARDING_STATUS] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sync onboarding statuses', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
