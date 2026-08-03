import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { postWithRetry } from '@/lib/webhook';

export type AgencyWebhookEvent =
  | 'merchant.approved'
  | 'merchant.denied'
  /**
   * Fortis has the application and has moved it into underwriting. In practice
   * this is the first signal that the merchant finished signing the MPA, so it
   * closes the blind window an agency previously sat in between
   * BANK_INFORMATION_SENT and a final decision — during which nothing was
   * emitted at all.
   *
   * It is named for what we can actually observe (Fortis pended the
   * application) rather than for what we infer (the merchant signed). If Fortis
   * later exposes an explicit signed/submitted signal, that becomes its own
   * event rather than changing the meaning of this one.
   */
  | 'merchant.application.pending_review'
  | 'checkout.session.completed';

interface MerchantApprovalPayload {
  event: 'merchant.approved' | 'merchant.denied' | 'merchant.application.pending_review';
  merchant: {
    id: number;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    businessName: string | null;
    organizationId: number | null;
  };
  onboarding: {
    status: string;
    previousStatus: string | null;
  };
  keys?: {
    publishableKey: string | null;
    secretKey: string | null;
  };
  timestamp: string;
}

export interface CheckoutSessionCompletedPayload {
  event: 'checkout.session.completed';
  session: {
    id: number;
    token: string;
    amount: number;
    currency: string;
    description: string | null;
    customer_email: string | null;
    customer_name: string | null;
    metadata: Record<string, unknown> | null;
    mode: string;
    paid_at: string;
  };
  merchant: {
    id: number;
    organizationId: number;
    businessName: string | null;
  };
  // The Fortis-cleared transaction the customer just paid.
  transaction: {
    id: string;
    fortis_transaction_id: string | null;
    amount: number;
    payment_method: 'cc' | 'ach';
  };
  // The donor row LunarPay assigned to / created for this email/card.
  // Persist this on the partner side so subsequent /v1/subscriptions or
  // /v1/payment-schedules calls reference the same customer.
  customer: {
    id: number;
    email: string | null;
  } | null;
  // The saved card / bank token. Use this id when calling /v1/subscriptions
  // or /v1/payment-schedules for follow-up recurring charges.
  payment_method: {
    id: number;
    type: 'cc' | 'ach';
    last4: string | null;
  } | null;
  // Populated when the session was created with mode="subscription" or
  // mode="installments" — LunarPay already created the resource for you.
  resources: {
    subscription_id: number | null;
    payment_schedule_id: number | null;
  };
  timestamp: string;
}

export type AgencyWebhookPayload =
  | MerchantApprovalPayload
  | CheckoutSessionCompletedPayload;

/**
 * Original agency scheme: bare hex HMAC over the raw body alone, no timestamp.
 * Kept because existing agency receivers verify against exactly this — changing
 * it would silently 401 every delivery on their side.
 */
function signLegacy(body: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

/**
 * The scheme merchant webhooks already use (see lib/webhook.ts): the timestamp
 * is folded into the signed input so a captured payload can't be replayed with
 * a fresh timestamp, and the digest is prefixed so the algorithm is explicit.
 * Sent alongside the legacy header; new receivers should verify this one.
 */
function signStandard(body: string, secret: string, timestamp: string): string {
  return (
    'sha256=' +
    crypto.createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')
  );
}

/**
 * Send a webhook to an agency. Never throws.
 *
 * Retries transient failures (network error / 5xx / 429) with backoff, the same
 * contract merchant webhooks get — a single dropped `merchant.approved` used to
 * be unrecoverable, because Fortis approval has no other push signal.
 *
 * IMPORTANT: the retry delays mean this can outlive the HTTP response that
 * triggered it. Request handlers must either await it or hand it to `after()`
 * from `next/server`; a bare fire-and-forget call risks the serverless
 * invocation being torn down mid-backoff.
 */
export async function sendAgencyWebhook(
  agencyId: number,
  payload: AgencyWebhookPayload
): Promise<boolean> {
  try {
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      select: { webhookUrl: true, webhookSecret: true, name: true },
    });

    if (!agency?.webhookUrl) return false;

    const body = JSON.stringify(payload);

    // Record the attempt before making it. If the process dies mid-delivery the
    // row survives as `pending`, which is the whole point: an event that never
    // reached the agency is now visible and replayable instead of being a line
    // in a log nobody read.
    const deliveryId = await openDeliveryRecord({
      agencyId,
      event: payload.event,
      url: agency.webhookUrl,
      body,
      organizationId:
        'merchant' in payload ? payload.merchant?.organizationId ?? null : null,
    });

    const delivered = await deliverToAgency(
      agency.webhookUrl,
      agency.webhookSecret,
      payload.event,
      payload.timestamp,
      body,
    );

    await closeDeliveryRecord(deliveryId, delivered);

    if (delivered) {
      console.log(`[Agency Webhook] Delivered ${payload.event} to ${agency.name}`);
    } else {
      console.error(
        `[Agency Webhook] Gave up delivering ${payload.event} to ${agency.name} ` +
          `(${agency.webhookUrl}) — delivery #${deliveryId ?? 'unrecorded'} is replayable`
      );
    }
    return delivered;
  } catch (err) {
    console.error(`[Agency Webhook] Error sending to agency ${agencyId}:`, err);
    return false;
  }
}

/**
 * Sign and POST a pre-serialized agency payload.
 *
 * Split out so a replay re-sends the byte-identical body with the identical
 * signature — both schemes derive from the timestamp carried inside the
 * payload, so re-signing a stored body reproduces the original headers exactly
 * and the receiver's verification still passes.
 */
export async function deliverToAgency(
  url: string,
  secret: string | null,
  event: string,
  timestamp: string,
  body: string,
): Promise<boolean> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'LunarPay-Webhook/1.0',
    'X-LunarPay-Event': event,
    'X-LunarPay-Timestamp': timestamp,
  };

  if (secret) {
    headers['X-LunarPay-Signature'] = signLegacy(body, secret);
    headers['X-LunarPay-Signature-V2'] = signStandard(body, secret, timestamp);
  }

  return postWithRetry(url, headers, body, `agency:${event}`);
}

/**
 * Persistence helpers. Both swallow their own errors: the delivery log is
 * diagnostic, and a problem writing it must never take down the delivery it is
 * describing.
 */
async function openDeliveryRecord(input: {
  agencyId: number;
  organizationId: number | null;
  event: string;
  url: string;
  body: string;
}): Promise<bigint | null> {
  try {
    const row = await prisma.webhookDelivery.create({
      data: {
        target: 'agency',
        agencyId: input.agencyId,
        organizationId: input.organizationId,
        event: input.event,
        url: input.url,
        payload: input.body,
        status: 'pending',
        attempts: 1,
      },
      select: { id: true },
    });
    return row.id;
  } catch (err) {
    console.error('[Agency Webhook] Could not record delivery attempt:', err);
    return null;
  }
}

async function closeDeliveryRecord(
  deliveryId: bigint | null,
  delivered: boolean,
  note?: string,
): Promise<void> {
  if (deliveryId === null) return;
  try {
    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: delivered ? 'delivered' : 'failed',
        deliveredAt: delivered ? new Date() : null,
        lastError: delivered ? null : note ?? 'Delivery failed after retries',
      },
    });
  } catch (err) {
    console.error('[Agency Webhook] Could not finalize delivery record:', err);
  }
}

/**
 * Look up the merchant's agency and fire the webhook if one is configured.
 * `userId` is the merchant's User.id.
 */
export async function notifyAgencyOfStatusChange(
  userId: number,
  organizationId: number,
  newStatus: 'ACTIVE' | 'DENIED' | 'PENDING_REVIEW',
  previousStatus: string | null
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        agencyId: true,
      },
    });

    if (!user?.agencyId) return;

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true },
    });

    // Fetch merchant API keys so the agency can store them
    const keys = await prisma.$queryRaw<
      { publishable_key: string | null; secret_key: string | null }[]
    >`SELECT publishable_key, secret_key FROM users WHERE id = ${userId}`;

    const eventName: MerchantApprovalPayload['event'] =
      newStatus === 'ACTIVE'
        ? 'merchant.approved'
        : newStatus === 'DENIED'
        ? 'merchant.denied'
        : 'merchant.application.pending_review';

    const payload: AgencyWebhookPayload = {
      event: eventName,
      merchant: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        businessName: org?.name || null,
        organizationId: org?.id || null,
      },
      onboarding: {
        status: newStatus,
        previousStatus,
      },
      keys:
        newStatus === 'ACTIVE' && keys.length > 0
          ? {
              publishableKey: keys[0].publishable_key,
              secretKey: keys[0].secret_key,
            }
          : undefined,
      timestamp: new Date().toISOString(),
    };

    // Awaited so the retry backoff runs to completion. Callers hand this to
    // `after()` or await it themselves rather than dropping the promise.
    await sendAgencyWebhook(user.agencyId, payload);
  } catch (err) {
    console.error('[Agency Webhook] notifyAgencyOfStatusChange error:', err);
  }
}
