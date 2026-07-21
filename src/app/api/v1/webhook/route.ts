/**
 * GET  /api/v1/webhook — Retrieve current webhook configuration
 * PUT  /api/v1/webhook — Set webhook URL (and rotate secret)
 * DELETE /api/v1/webhook — Remove webhook configuration
 *
 * LunarPay signs every outbound delivery with HMAC-SHA256:
 *   Header:  X-LunarPay-Signature: sha256=<hex>
 *   Input:   `${X-LunarPay-Timestamp}.${raw_body}`
 *
 * Events delivered:
 *   payment.succeeded   — subscription or installment charge succeeded
 *   payment.failed      — subscription or installment charge declined
 *   subscription.cancelled — subscription auto-cancelled after 4 consecutive failures
 *   charge.succeeded    — POST /api/v1/charges succeeded
 *   charge.failed       — POST /api/v1/charges declined
 */

import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireSecretKey, ApiAuthError, apiError } from '@/lib/api-auth';

const putSchema = z.object({
  url: z.string().url('Must be a valid HTTPS URL').refine(
    (u) => u.startsWith('https://'),
    'Webhook URL must use HTTPS',
  ),
  // Opt-in secret rotation. Re-registering the same URL (idempotent deploy
  // scripts etc.) must NOT silently invalidate the stored secret — that
  // breaks every subsequent signature check on the merchant side.
  rotate_secret: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSecretKey(request);
    const org = await prisma.organization.findUnique({
      where: { id: auth.organizationId },
      select: { webhookUrl: true, webhookSecret: true },
    });
    return Response.json({
      data: {
        url: org?.webhookUrl || null,
        has_secret: !!org?.webhookSecret,
        // Expose last 4 chars of secret so merchants can confirm which version is active
        secret_hint: org?.webhookSecret
          ? '••••' + org.webhookSecret.slice(-4)
          : null,
      },
    });
  } catch (e) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    return apiError('Internal server error', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireSecretKey(request);
    const body = await request.json();
    const parsed = putSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation error', 400, parsed.error.flatten().fieldErrors);
    }

    // Rotate only when explicitly requested, or when no secret exists yet.
    const existing = await prisma.organization.findUnique({
      where: { id: auth.organizationId },
      select: { webhookSecret: true },
    });
    const shouldRotate = parsed.data.rotate_secret === true || !existing?.webhookSecret;
    const secret = shouldRotate
      ? 'whsec_' + crypto.randomBytes(24).toString('hex')
      : null;

    await prisma.organization.update({
      where: { id: auth.organizationId },
      data: {
        webhookUrl: parsed.data.url,
        ...(secret ? { webhookSecret: secret } : {}),
      },
    });

    return Response.json({
      data: {
        url: parsed.data.url,
        ...(secret
          ? {
              secret,
              note: 'Store this secret securely — it will not be shown again. Use it to verify the X-LunarPay-Signature header on incoming webhook deliveries.',
            }
          : {
              secret_rotated: false,
              note: 'Existing signing secret kept. Pass rotate_secret:true to generate a new one.',
            }),
      },
    });
  } catch (e) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    return apiError('Internal server error', 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireSecretKey(request);
    await prisma.organization.update({
      where: { id: auth.organizationId },
      data: { webhookUrl: null, webhookSecret: null },
    });
    return Response.json({ data: { removed: true } });
  } catch (e) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    return apiError('Internal server error', 500);
  }
}
