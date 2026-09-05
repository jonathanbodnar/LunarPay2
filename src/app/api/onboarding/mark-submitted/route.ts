import { NextResponse } from 'next/server';
import { markApplicationSubmitted } from '@/lib/fortis/onboarding-sync';
import { resolveOnboardingOrganization, onboardingStatusResponse } from '@/lib/onboarding-access';

/**
 * POST /api/onboarding/mark-submitted
 *
 * The merchant reports that they signed and submitted the Fortis MPA. Fortis
 * gives us no signal for that, so this is how BANK_INFORMATION_SENT becomes
 * PENDING_REVIEW. Runs a reconciliation afterwards in case Fortis already
 * approved the application.
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

    const result = await markApplicationSubmitted(access.organizationId, 'merchant', { cooldownMs: 60_000 });
    return onboardingStatusResponse(result);
  } catch (error) {
    console.error('[Onboarding Mark Submitted] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
