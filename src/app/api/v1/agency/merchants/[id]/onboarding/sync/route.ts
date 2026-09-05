/**
 * POST /api/v1/agency/merchants/:id/onboarding/sync
 *
 * Reconcile the merchant's onboarding record with Fortis on demand
 * (stored-webhook replay, approval detection) and return the current status.
 */

import { NextRequest } from 'next/server';
import { requireAgencyKey, ApiAuthError, apiError } from '@/lib/api-auth';
import { syncOnboardingStatus } from '@/lib/fortis/onboarding-sync';
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

    const result = await syncOnboardingStatus(access.org.organizationId, { cooldownMs: 15_000 });
    return agencyOnboardingResponse(access.org, result);
  } catch (e) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    console.error('[v1/agency/merchants/:id/onboarding/sync POST]', e);
    return apiError('Internal server error', 500);
  }
}
