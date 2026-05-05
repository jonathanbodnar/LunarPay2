import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export type AgencyWebhookEvent =
  | 'merchant.approved'
  | 'merchant.denied'
  | 'checkout.session.completed';

interface MerchantApprovalPayload {
  event: 'merchant.approved' | 'merchant.denied';
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

function signPayload(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Send a webhook to an agency when one of their merchants' onboarding status changes.
 * Fire-and-forget: failures are logged but don't block the caller.
 */
export async function sendAgencyWebhook(
  agencyId: number,
  payload: AgencyWebhookPayload
): Promise<void> {
  try {
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      select: { webhookUrl: true, webhookSecret: true, name: true },
    });

    if (!agency?.webhookUrl) return;

    const body = JSON.stringify(payload);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'LunarPay-Webhook/1.0',
      'X-LunarPay-Event': payload.event,
      'X-LunarPay-Timestamp': payload.timestamp,
    };

    if (agency.webhookSecret) {
      headers['X-LunarPay-Signature'] = signPayload(body, agency.webhookSecret);
    }

    const res = await fetch(agency.webhookUrl, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      console.error(
        `[Agency Webhook] Failed to deliver to ${agency.name} (${agency.webhookUrl}): ${res.status} ${res.statusText}`
      );
    } else {
      console.log(
        `[Agency Webhook] Delivered ${payload.event} to ${agency.name}`
      );
    }
  } catch (err) {
    console.error(`[Agency Webhook] Error sending to agency ${agencyId}:`, err);
  }
}

/**
 * Look up the merchant's agency and fire the webhook if one is configured.
 * `userId` is the merchant's User.id.
 */
export async function notifyAgencyOfStatusChange(
  userId: number,
  organizationId: number,
  newStatus: 'ACTIVE' | 'DENIED',
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

    const payload: AgencyWebhookPayload = {
      event: newStatus === 'ACTIVE' ? 'merchant.approved' : 'merchant.denied',
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

    // Fire and forget
    sendAgencyWebhook(user.agencyId, payload).catch(() => {});
  } catch (err) {
    console.error('[Agency Webhook] notifyAgencyOfStatusChange error:', err);
  }
}
