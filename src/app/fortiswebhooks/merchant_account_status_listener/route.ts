import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { routeWebhook } from '@/lib/fortis/webhook-handler';

/**
 * Fortis Webhook Handler - Legacy URL
 * Matches the old PHP endpoint: /fortiswebhooks/merchant_account_status_listener
 *
 * Fortis classic posts here WITHOUT a signature, so this endpoint is open to
 * the internet and its body must never be trusted. It is passed to routeWebhook
 * as `unsigned`, which treats the payload purely as a signal to go re-read the
 * authoritative state from Fortis over an authenticated call. Nothing the
 * caller sends is written to the database.
 *
 * Prefer /api/fortis/webhooks (HMAC-verified) for any new Fortis configuration.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log('[Fortis Webhook - Legacy URL] Received (unsigned, will be attested)');

    // Archived under a DISTINCT system tag. Anyone can post here, so these rows
    // are unverified caller input and must never be replayed as if they were
    // Fortis's word — /api/fortis/check-status has a fallback that reads stored
    // webhooks and applies the credentials inside them, which would otherwise
    // let a planted row hand a merchant attacker-controlled processor keys the
    // next time they clicked "check status".
    //
    // Truncated so the endpoint can't be used to inflate the table.
    const serialized = JSON.stringify(body);
    await prisma.fortisWebhook.create({
      data: {
        eventJson: serialized.length > 20000 ? serialized.slice(0, 20000) + '…[truncated]' : serialized,
        system: 'lunarpay-unsigned',
        mode: (body as any).stage || 'unknown',
      },
    });

    return await routeWebhook(body, 'unsigned');
  } catch (error) {
    console.error('[Fortis Webhook - Legacy] Error:', error);
    return NextResponse.json({ status: false, message: 'Internal server error' }, { status: 500 });
  }
}
