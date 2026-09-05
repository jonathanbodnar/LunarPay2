import { NextResponse } from 'next/server';
import { activateWithCredentials, syncOnboardingStatus } from '@/lib/fortis/onboarding-sync';

/**
 * POST /api/admin/recover-status
 *
 * Recover a merchant's onboarding status when the Fortis webhook was missed.
 * Fortis has no endpoint to read an application, so there are two paths:
 *
 *   - With `authUserId` + `authUserApiKey` (copied from the Fortis portal):
 *     apply the credentials and move the record to ACTIVE.
 *   - Without: reconcile with Fortis (replay a stored webhook, detect approval
 *     through the users list).
 *
 * Body: { organizationId, authUserId?, authUserApiKey?, locationId?,
 *         productTransactionId?, achProductTransactionId? }
 * Requires CRON_SECRET header or admin_key for authentication.
 */
export const maxDuration = 60;

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const { searchParams } = new URL(request.url);
  const adminKey = searchParams.get('admin_key');
  const cronAdminKey = process.env.CRON_ADMIN_KEY;
  const oneTimeToken = searchParams.get('token');

  const authorized =
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    (cronAdminKey && adminKey === cronAdminKey) ||
    false; // one-time token removed

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const organizationId = Number(body?.organizationId);

    if (!Number.isInteger(organizationId) || organizationId <= 0) {
      return NextResponse.json({ error: 'organizationId required' }, { status: 400 });
    }

    const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);
    const authUserId = str(body.authUserId);
    const authUserApiKey = str(body.authUserApiKey);

    const result =
      authUserId && authUserApiKey
        ? await activateWithCredentials(organizationId, {
            authUserId,
            authUserApiKey,
            locationId: str(body.locationId),
            productTransactionId: str(body.productTransactionId),
            achProductTransactionId: str(body.achProductTransactionId),
          })
        : await syncOnboardingStatus(organizationId);

    if (result.source === 'no_onboarding') {
      return NextResponse.json({ error: 'Organization or onboarding not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: result.message,
      currentStatus: result.status,
      result,
    });
  } catch (error) {
    console.error('[Admin Recover Status] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
