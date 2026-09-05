/**
 * POST /api/v1/agency/merchants/:id/onboarding/submitted
 *
 * The agency reports that the merchant signed and submitted the Fortis MPA
 * (Fortis sends no signal for that). Moves BANK_INFORMATION_SENT to
 * PENDING_REVIEW, then reconciles with Fortis in case the application was
 * already approved.
 */

import { NextRequest } from 'next/server';
import { requireAgencyKey, ApiAuthError, apiError } from '@/lib/api-auth';
import { markApplicationSubmitted } from '@/lib/fortis/onboarding-sync';
import { resolveAgencyMerchantOrganization, agencyOnboardingResponse } from '@/lib/onboarding-access';

export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const agency = await requireAgencyKey(request);
    const { id } = await params;
    const merchantId = parseInt(id);
    if (isNaN(merchantId)) return apiError('Invalid merchant ID', 400);

    const access = await resolveAgencyMerchantOrganization(agency.agencyId, merchantId);
    if (!access.ok) return apiError(access.error, access.status);

    const result = await markApplicationSubmitted(access.org.organizationId, 'agency', { cooldownMs: 15_000 });
    return agencyOnboardingResponse(access.org, result);
  } catch (e) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    console.error('[v1/agency/merchants/:id/onboarding/submitted POST]', e);
    return apiError('Internal server error', 500);
  }
}
