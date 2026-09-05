import { NextResponse } from 'next/server';
import { syncOnboardingStatus } from '@/lib/fortis/onboarding-sync';
import { resolveOnboardingOrganization, onboardingStatusResponse } from '@/lib/onboarding-access';

/**
 * POST /api/onboarding/sync-status
 *
 * Reconcile one organization's onboarding record with Fortis (stored-webhook
 * replay, approval detection) and return the current status.
 *
 * Body: `{ token?: string, organizationId?: number }` — either the public
 * organization token (standalone onboarding page) or a dashboard session plus
 * the organization id. Middleware lists this route as public; auth is here.
 */
// Agency webhook retries are deferred with after(); give the function room for them.
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const access = await resolveOnboardingOrganization(request);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const result = await syncOnboardingStatus(access.organizationId, { cooldownMs: 60_000 });
    return onboardingStatusResponse(result);
  } catch (error) {
    console.error('[Onboarding Sync Status] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
