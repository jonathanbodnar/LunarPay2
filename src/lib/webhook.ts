/**
 * Outbound webhook delivery for merchant-configured endpoints.
 *
 * Merchants register a URL + secret via PUT /api/v1/webhook.
 * LunarPay signs every delivery with HMAC-SHA256 so receivers can verify
 * authenticity:
 *
 *   X-LunarPay-Signature: sha256=<hex>
 *   X-LunarPay-Event:     payment.succeeded | payment.failed | ...
 *   X-LunarPay-Timestamp: <ISO 8601>
 *
 * The HMAC input is: `${timestamp}.${JSON.stringify(payload)}`
 * Receivers should verify: `sha256=` + HMAC-SHA256(secret, input).
 */

import crypto from 'crypto';

// ── Event types ───────────────────────────────────────────────────────────────

export type WebhookEventType =
  | 'payment.succeeded'
  | 'payment.failed'
  | 'payment.refunded'
  | 'subscription.cancelled'
  | 'charge.succeeded'
  | 'charge.failed';

export interface WebhookPayload {
  event: WebhookEventType;
  timestamp: string;
  organization_id: number;
  data: Record<string, unknown>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sign(secret: string, timestamp: string, body: string): string {
  return 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${body}`)
    .digest('hex');
}

// ── Core delivery ─────────────────────────────────────────────────────────────

const DELIVERY_TIMEOUT_MS = 10_000;
const RETRY_DELAYS_MS = [1_000, 5_000];

// Payloads may carry Prisma BigInt ids (Transaction.id). Plain JSON.stringify
// THROWS on BigInt — which historically killed every payment.succeeded /
// payment.failed / charge.succeeded delivery before the HTTP request was even
// made. Serialize BigInt as a string, matching how ids appear elsewhere in
// the API.
function safeStringify(value: unknown): string {
  return JSON.stringify(value, (_key, v) =>
    typeof v === 'bigint' ? v.toString() : v,
  );
}

/**
 * POST with bounded retry. A merchant endpoint being down must not lose the
 * event on the first hiccup: retry transient failures (network errors / 5xx /
 * 429) a couple of times with backoff. 4xx responses are the receiver
 * rejecting the event — retrying those won't help.
 */
async function postWithRetry(
  url: string,
  headers: Record<string, string>,
  body: string,
  eventLabel: string,
): Promise<boolean> {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
      });
      if (res.ok) {
        console.log(`[Webhook] Delivered ${eventLabel} to ${url}`);
        return true;
      }
      const retryable = res.status >= 500 || res.status === 429;
      console.error(
        `[Webhook] Delivery failed (${res.status}) to ${url} for event ${eventLabel}` +
          (retryable && attempt < RETRY_DELAYS_MS.length ? ' — retrying' : ''),
      );
      if (!retryable || attempt >= RETRY_DELAYS_MS.length) return false;
    } catch (err) {
      console.error(
        `[Webhook] Delivery error to ${url} for event ${eventLabel}:`,
        err,
      );
      if (attempt >= RETRY_DELAYS_MS.length) return false;
    }
    await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
  }
}

export async function sendOrgWebhook(
  webhookUrl: string,
  webhookSecret: string | null | undefined,
  payload: WebhookPayload,
): Promise<boolean> {
  const timestamp = payload.timestamp;
  const body = safeStringify(payload);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'LunarPay-Webhook/1.0',
    'X-LunarPay-Event': payload.event,
    'X-LunarPay-Timestamp': timestamp,
  };
  if (webhookSecret) {
    headers['X-LunarPay-Signature'] = sign(webhookSecret, timestamp, body);
  }
  return postWithRetry(webhookUrl, headers, body, payload.event);
}

/**
 * Fire-and-forget delivery. Never throws — webhook failure must never block
 * the calling payment flow.
 *
 * IMPORTANT: in cron/short-lived contexts the process may exit right after
 * the loop finishes, killing any pending fetch. Cron callers must use
 * `deliverWebhook` (awaited) instead.
 */
export function fireWebhook(
  webhookUrl: string | null | undefined,
  webhookSecret: string | null | undefined,
  event: WebhookEventType,
  organizationId: number,
  data: Record<string, unknown>,
): void {
  deliverWebhook(webhookUrl, webhookSecret, event, organizationId, data).catch(
    (err) => console.error('[Webhook] Unexpected delivery error:', err),
  );
}

/**
 * Awaitable delivery with the same never-throws contract. Resolves true when
 * the receiver acknowledged the event with a 2xx.
 */
export async function deliverWebhook(
  webhookUrl: string | null | undefined,
  webhookSecret: string | null | undefined,
  event: WebhookEventType,
  organizationId: number,
  data: Record<string, unknown>,
): Promise<boolean> {
  if (!webhookUrl) return false;
  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    organization_id: organizationId,
    data,
  };
  try {
    return await sendOrgWebhook(webhookUrl, webhookSecret, payload);
  } catch (err) {
    console.error('[Webhook] Unexpected delivery error:', err);
    return false;
  }
}

// ── Legacy payment-link webhook (kept for backward compat) ────────────────────

interface LegacyWebhookPayload {
  event: 'payment.completed' | 'payment.failed' | 'subscription.created';
  payment_link_id: number;
  payment_link_name: string;
  customer: { email: string; name: string; phone?: string };
  payment: { amount: number; currency: string; method: string; transaction_id: string };
  products: Array<{ name: string; qty: number; price: number }>;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export async function sendWebhook(
  webhookUrl: string,
  payload: LegacyWebhookPayload,
): Promise<{ success: boolean; error?: string; statusCode?: number }> {
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'LunarPay-Webhook/1.0',
        'X-LunarPay-Event': payload.event,
        'X-LunarPay-Timestamp': payload.timestamp,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}: ${res.statusText}`, statusCode: res.status };
    }
    return { success: true, statusCode: res.status };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Deliver a payment-link webhook using the documented payload shape (the one
 * merchants see on the payment-link create/edit form). Retries transient
 * failures and never throws. Awaited by the payment routes so the delivery
 * actually runs to completion before the request handler returns (fire-and-
 * forget would be dropped when the serverless function terminates after
 * responding).
 */
export async function deliverPaymentLinkWebhook(
  webhookUrl: string | null | undefined,
  payload: LegacyWebhookPayload,
): Promise<boolean> {
  if (!webhookUrl) return false;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'LunarPay-Webhook/1.0',
    'X-LunarPay-Event': payload.event,
    'X-LunarPay-Timestamp': payload.timestamp,
  };
  try {
    return await postWithRetry(webhookUrl, headers, JSON.stringify(payload), payload.event);
  } catch (err) {
    console.error('[Webhook] Unexpected payment-link delivery error:', err);
    return false;
  }
}

export function createPaymentWebhookPayload(
  paymentLinkId: number,
  paymentLinkName: string,
  customer: { email: string; name: string; phone?: string },
  payment: { amount: number; method: string; transactionId: string },
  products: Array<{ name: string; qty: number; price: number }>,
  metadata?: Record<string, unknown>,
  event: LegacyWebhookPayload['event'] = 'payment.completed',
): LegacyWebhookPayload {
  return {
    event,
    payment_link_id: paymentLinkId,
    payment_link_name: paymentLinkName,
    customer,
    payment: { amount: payment.amount, currency: 'USD', method: payment.method, transaction_id: payment.transactionId },
    products,
    timestamp: new Date().toISOString(),
    metadata,
  };
}

export async function queueWebhook(webhookUrl: string, payload: LegacyWebhookPayload): Promise<void> {
  sendWebhook(webhookUrl, payload).catch((error) => {
    console.error('Queued webhook failed:', error);
  });
}

// ── Stripe-compatible payment-link webhook ────────────────────────────────────
//
// Some merchants built their receiver against Stripe's event shape (top-level
// `id` + `object: "event"` + `type` + `data.object`). A payment link with
// webhookFormat = 'stripe' emits that envelope instead of the native LunarPay
// payload, so those endpoints accept it. The merchant-supplied
// client_reference_id (passed in via the link URL) is echoed in standard Stripe
// locations so the receiver can reconcile the payment with its own user.

export type PaymentLinkWebhookFormat = 'lunarpay' | 'stripe';

export interface StripeStyleEvent {
  id: string;
  object: 'event';
  api_version: string;
  created: number;
  type: string;
  data: { object: Record<string, unknown> };
}

export async function deliverStripeWebhook(
  webhookUrl: string | null | undefined,
  event: StripeStyleEvent,
): Promise<boolean> {
  if (!webhookUrl) return false;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'LunarPay-Webhook/1.0',
    'X-LunarPay-Event': event.type,
    'X-LunarPay-Timestamp': new Date(event.created * 1000).toISOString(),
  };
  try {
    return await postWithRetry(webhookUrl, headers, JSON.stringify(event), event.type);
  } catch (err) {
    console.error('[Webhook] Unexpected Stripe-format delivery error:', err);
    return false;
  }
}

export interface PaymentLinkEventInput {
  webhookUrl?: string | null;
  format?: string | null; // 'lunarpay' (default) | 'stripe'
  isSubscription: boolean;
  paymentLinkId: number;
  paymentLinkName: string;
  paymentLinkHash: string;
  customer: { email: string; name: string };
  amountDollars: number;
  method: string; // 'card' | 'ach'
  gatewayTransactionId: string; // Fortis transaction id
  lunarTransactionId: string; // LunarPay transaction row id (used for idempotency)
  subscriptionId?: number | null;
  clientReferenceId?: string | null;
  products: Array<{ name: string; qty: number; price: number }>;
  status: string; // 'completed' | 'pending'
}

/**
 * Deliver a payment-link webhook in the format the merchant configured on the
 * link. Never throws; retries transient failures.
 */
export async function deliverPaymentLinkEvent(opts: PaymentLinkEventInput): Promise<boolean> {
  if (!opts.webhookUrl) return false;
  const format = (opts.format || 'lunarpay').toLowerCase();

  if (format === 'stripe') {
    const amountCents = Math.round(opts.amountDollars * 100);
    const metadata = {
      source: 'lunarpay',
      client_reference_id: opts.clientReferenceId || null,
      email: opts.customer.email || null,
      name: opts.customer.name || null,
      lunarpay_payment_link_id: String(opts.paymentLinkId),
      lunarpay_payment_link_hash: opts.paymentLinkHash,
      lunarpay_transaction_id: opts.lunarTransactionId,
      lunarpay_subscription_id: opts.subscriptionId != null ? String(opts.subscriptionId) : null,
    };
    const object: Record<string, unknown> = {
      id: opts.subscriptionId ? `sub_${opts.subscriptionId}` : opts.lunarTransactionId,
      object: opts.isSubscription ? 'subscription' : 'payment_intent',
      customer: null,
      customer_email: opts.customer.email || null,
      client_reference_id: opts.clientReferenceId || null,
      status: opts.isSubscription ? 'active' : 'succeeded',
      amount: amountCents,
      amount_total: amountCents,
      currency: 'usd',
      description: opts.paymentLinkName,
      metadata,
    };
    const event: StripeStyleEvent = {
      // Deterministic id gives the receiver a natural idempotency key.
      id: `evt_lp_${opts.lunarTransactionId}`,
      object: 'event',
      api_version: '2024-06-20',
      created: Math.floor(Date.now() / 1000),
      type: opts.isSubscription ? 'customer.subscription.created' : 'payment_intent.succeeded',
      data: { object },
    };
    return deliverStripeWebhook(opts.webhookUrl, event);
  }

  // Default: native LunarPay payload (documented on the create/edit form).
  const payload = createPaymentWebhookPayload(
    opts.paymentLinkId,
    opts.paymentLinkName,
    { email: opts.customer.email, name: opts.customer.name },
    { amount: opts.amountDollars, method: opts.method, transactionId: opts.gatewayTransactionId },
    opts.products,
    {
      payment_link_hash: opts.paymentLinkHash,
      transaction_id: opts.lunarTransactionId,
      subscription_id: opts.subscriptionId != null ? String(opts.subscriptionId) : null,
      is_subscription: opts.isSubscription,
      status: opts.status,
      client_reference_id: opts.clientReferenceId || null,
    },
    opts.isSubscription ? 'subscription.created' : 'payment.completed',
  );
  return deliverPaymentLinkWebhook(opts.webhookUrl, payload);
}
