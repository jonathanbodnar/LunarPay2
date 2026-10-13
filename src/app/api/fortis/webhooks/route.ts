import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { routeWebhook, handleAchTransactionPostback } from '@/lib/fortis/webhook-handler';
import { parseTransactionPostback } from '@/lib/fortis/webhook-body';
import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.FORTIS_WEBHOOK_SECRET;

function verifyWebhookSignature(payload: string, signature: string | null): boolean {
  if (!WEBHOOK_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[SECURITY] FORTIS_WEBHOOK_SECRET not configured - rejecting webhook');
      return false;
    }
    return true;
  }

  if (!signature) {
    console.error('[SECURITY] Webhook received without signature');
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch {
    return false;
  }
}

/**
 * Fortis Webhook Handler - New URL with HMAC signature verification
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-fortis-signature') || request.headers.get('x-signature');

    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error('[SECURITY] Invalid webhook signature - rejecting request');
      return NextResponse.json({ status: false, message: 'Invalid signature' }, { status: 401 });
    }

    // JSON exactly as before; a non-JSON body is only used if it is a
    // form-encoded Fortis transaction postback naming an ACH debit.
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (notJson) {
      const record = parseTransactionPostback(rawBody);
      const handled = record ? await handleAchTransactionPostback(record) : null;
      if (handled) return handled;
      throw notJson;
    }

    await prisma.fortisWebhook.create({
      data: {
        eventJson: JSON.stringify(body),
        system: 'lunarpay',
        mode: (body as any).stage || 'unknown',
      },
    });

    return await routeWebhook(body);
  } catch (error) {
    console.error('[Fortis Webhook] Error:', error);
    return NextResponse.json({ status: false, message: 'Internal server error' }, { status: 500 });
  }
}
