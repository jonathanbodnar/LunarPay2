import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { routeWebhook } from '@/lib/fortis/webhook-handler';

/**
 * Fortis Webhook Handler - Legacy URL
 * Matches the old PHP endpoint: /fortiswebhooks/merchant_account_status_listener
 * No signature verification (Fortis classic callback).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

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
