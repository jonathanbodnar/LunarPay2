import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { routeWebhook, handleAchTransactionPostback } from '@/lib/fortis/webhook-handler';
import { parseTransactionPostback } from '@/lib/fortis/webhook-body';

/**
 * Fortis Webhook Handler - Legacy URL
 * Matches the old PHP endpoint: /fortiswebhooks/merchant_account_status_listener
 * No signature verification (Fortis classic callback).
 *
 * JSON is parsed and handled exactly as before. A body that is not JSON is
 * only ever used if it is a form-encoded Fortis transaction postback naming
 * an ACH debit (re-read from Fortis, never trusted); otherwise it fails as it
 * always has.
 */
export async function POST(request: Request) {
  try {
    const raw = await request.text();
    let body;
    try {
      body = JSON.parse(raw);
    } catch (notJson) {
      const record = parseTransactionPostback(raw);
      const handled = record ? await handleAchTransactionPostback(record) : null;
      if (handled) return handled;
      throw notJson;
    }

    console.log('[Fortis Webhook - Legacy URL] Received');

    await prisma.fortisWebhook.create({
      data: {
        eventJson: JSON.stringify(body),
        system: 'lunarpay',
        mode: (body as any).stage || 'unknown',
      },
    });

    return await routeWebhook(body);
  } catch (error) {
    console.error('[Fortis Webhook - Legacy] Error:', error);
    return NextResponse.json({ status: false, message: 'Internal server error' }, { status: 500 });
  }
}
