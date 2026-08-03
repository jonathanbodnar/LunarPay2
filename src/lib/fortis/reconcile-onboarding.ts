/**
 * Reconcile one merchant's onboarding state against Fortis.
 *
 * Fortis's approval webhook is the primary signal, but it is a single push with
 * no guaranteed redelivery: when one is missed the merchant sits in
 * BANK_INFORMATION_SENT forever while Fortis considers them live. This is the
 * pull side of that, used by the polling cron so an agency does not have to
 * notice on its own.
 *
 * The field-resolution logic lives here rather than being written out at each
 * call site. It had already been copy-pasted into three routes, and each copy
 * had drifted into a different bug — wrong nesting in one, first-product-by-
 * position in another, ACH id never set in a third.
 */

import { prisma } from '@/lib/prisma';
import { createFortisClient } from '@/lib/fortis/client';

export interface ReconcileResult {
  organizationId: number;
  changed: boolean;
  previousStatus: string | null;
  newStatus: string | null;
  reason: string;
}

function resolveEnv(): 'sandbox' | 'production' {
  const raw = process.env.FORTIS_ENVIRONMENT || process.env.fortis_environment || 'sandbox';
  return raw === 'production' || raw === 'prd' || raw === 'prod' ? 'production' : 'sandbox';
}

export async function reconcileOnboardingFromFortis(
  organizationId: number
): Promise<ReconcileResult> {
  const base = { organizationId, changed: false, newStatus: null as string | null };

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: { fortisOnboarding: true },
  });

  if (!org?.fortisOnboarding) {
    return { ...base, previousStatus: null, reason: 'no onboarding record' };
  }

  const previousStatus = org.fortisOnboarding.appStatus;

  if (previousStatus === 'ACTIVE') {
    return { ...base, previousStatus, reason: 'already active' };
  }

  let result;
  try {
    result = await createFortisClient().getOnboardingStatus(organizationId.toString());
  } catch (e) {
    return {
      ...base,
      previousStatus,
      reason: `lookup threw: ${e instanceof Error ? e.message : 'unknown'}`,
    };
  }

  if (!result.status || !result.data) {
    return { ...base, previousStatus, reason: result.message || 'no application data' };
  }

  const data = result.data;

  // Credentials are the approval signal. The application record carries no
  // status field on the responses observed in production, so a decline is not
  // detectable here — that still depends on the Fortis webhook.
  if (!data.users?.length) {
    return { ...base, previousStatus, reason: 'no credentials issued yet' };
  }

  const merchantUser = data.users[0];

  // location_id and product_transactions are TOP LEVEL on this record. There is
  // no `locations` array; the nested reads below are kept only for a v1+ shape.
  let locationId: string | null =
    data.location_id ??
    merchantUser.location_id ??
    merchantUser.locations?.[0]?.id ??
    data.locations?.[0]?.id ??
    null;

  let ccProductTransactionId: string | null = null;
  let achProductTransactionId: string | null = null;

  const collect = (pts?: Array<{ id: string; payment_method?: string }>) => {
    for (const pt of pts ?? []) {
      const method = pt.payment_method?.toLowerCase();
      if (method === 'cc' && !ccProductTransactionId) ccProductTransactionId = pt.id;
      if (method === 'ach' && !achProductTransactionId) achProductTransactionId = pt.id;
    }
  };

  collect(data.product_transactions);
  for (const loc of data.locations ?? []) collect(loc.product_transactions);

  // Last resort: ask the location directly with the merchant's own credentials.
  if (!ccProductTransactionId && !achProductTransactionId && locationId) {
    try {
      const merchantClient = createFortisClient(
        resolveEnv(),
        merchantUser.user_id,
        merchantUser.user_api_key
      );
      const loc = await merchantClient.getLocation(locationId, {
        expand: ['product_transactions'],
      });
      collect(loc.location?.product_transactions);
    } catch (e) {
      console.error('[Reconcile] location product lookup failed:', e);
    }
  }

  const finalLocationId = locationId ?? org.fortisOnboarding.locationId;
  const finalCc = ccProductTransactionId || org.fortisOnboarding.productTransactionId || null;
  const finalAch = achProductTransactionId || org.fortisOnboarding.achProductTransactionId || null;

  // Activating without routing data produces a merchant who looks live and
  // cannot take a payment: api-auth only checks appStatus, while /v1/intentions
  // rejects on the missing location or product. Leave them in flight instead.
  if (!finalLocationId || (!finalCc && !finalAch)) {
    return {
      ...base,
      previousStatus,
      reason: `incomplete routing data (location=${!!finalLocationId}, product=${!!(finalCc || finalAch)})`,
    };
  }

  await prisma.fortisOnboarding.update({
    where: { id: org.fortisOnboarding.id },
    data: {
      authUserId: merchantUser.user_id,
      authUserApiKey: merchantUser.user_api_key,
      locationId: finalLocationId,
      productTransactionId: finalCc,
      achProductTransactionId: finalAch,
      appStatus: 'ACTIVE',
      processorResponse: JSON.stringify(data),
      updatedAt: new Date(),
    },
  });

  return {
    organizationId,
    changed: true,
    previousStatus,
    newStatus: 'ACTIVE',
    reason: 'credentials issued by Fortis',
  };
}
