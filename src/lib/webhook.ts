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

export async function sendOrgWebhook(
  webhookUrl: string,
  webhookSecret: string | null | undefined,
  payload: WebhookPayload,
): Promise<void> {
  const timestamp = payload.timestamp;
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'LunarPay-Webhook/1.0',
    'X-LunarPay-Event': payload.event,
    'X-LunarPay-Timestamp': timestamp,
  };
  if (webhookSecret) {
    headers['X-LunarPay-Signature'] = sign(webhookSecret, timestamp, body);
  }

  const res = await fetch(webhookUrl, { method: 'POST', headers, body });
  if (!res.ok) {
    console.error(`[Webhook] Delivery failed (${res.status}) to ${webhookUrl} for event ${payload.event}`);
  } else {
    console.log(`[Webhook] Delivered ${payload.event} to ${webhookUrl}`);
  }
}

/**
 * Fire-and-forget delivery. Never throws — webhook failure must never block
 * the calling payment flow.
 */
export function fireWebhook(
  webhookUrl: string | null | undefined,
  webhookSecret: string | null | undefined,
  event: WebhookEventType,
  organizationId: number,
  data: Record<string, unknown>,
): void {
  if (!webhookUrl) return;
  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    organization_id: organizationId,
    data,
  };
  sendOrgWebhook(webhookUrl, webhookSecret, payload).catch((err) =>
    console.error('[Webhook] Unexpected delivery error:', err),
  );
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

export function createPaymentWebhookPayload(
  paymentLinkId: number,
  paymentLinkName: string,
  customer: { email: string; name: string; phone?: string },
  payment: { amount: number; method: string; transactionId: string },
  products: Array<{ name: string; qty: number; price: number }>,
  metadata?: Record<string, unknown>,
): LegacyWebhookPayload {
  return {
    event: 'payment.completed',
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
