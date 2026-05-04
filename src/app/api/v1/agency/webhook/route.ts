import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAgencyKey, ApiAuthError, apiError } from '@/lib/api-auth';
import crypto from 'crypto';

const updateSchema = z.object({
  webhookUrl: z.string().url().max(500),
});

/**
 * GET /api/v1/agency/webhook
 * Retrieve the current webhook configuration.
 */
export async function GET(request: NextRequest) {
  try {
    const agency = await requireAgencyKey(request);

    const record = await prisma.agency.findUnique({
      where: { id: agency.agencyId },
      select: { webhookUrl: true, webhookSecret: true },
    });

    return Response.json({
      data: {
        webhookUrl: record?.webhookUrl || null,
        hasSecret: !!record?.webhookSecret,
      },
    });
  } catch (e: any) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    console.error('[Agency Webhook Config] GET error:', e);
    return apiError('Internal server error', 500);
  }
}

/**
 * PUT /api/v1/agency/webhook
 * Set or update the webhook URL. Automatically generates an HMAC signing secret
 * if one doesn't already exist. Returns the secret so the agency can verify payloads.
 */
export async function PUT(request: NextRequest) {
  try {
    const agency = await requireAgencyKey(request);
    const parsed = updateSchema.safeParse(await request.json());

    if (!parsed.success) {
      return apiError(
        `Validation error: ${parsed.error.issues.map((e) => e.message).join(', ')}`,
        422
      );
    }

    const existing = await prisma.agency.findUnique({
      where: { id: agency.agencyId },
      select: { webhookSecret: true },
    });

    const webhookSecret =
      existing?.webhookSecret || `whsec_${crypto.randomBytes(32).toString('hex')}`;

    await prisma.agency.update({
      where: { id: agency.agencyId },
      data: {
        webhookUrl: parsed.data.webhookUrl,
        webhookSecret,
      },
    });

    return Response.json({
      data: {
        webhookUrl: parsed.data.webhookUrl,
        webhookSecret,
      },
    });
  } catch (e: any) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    console.error('[Agency Webhook Config] PUT error:', e);
    return apiError('Internal server error', 500);
  }
}

/**
 * DELETE /api/v1/agency/webhook
 * Remove the webhook URL and secret.
 */
export async function DELETE(request: NextRequest) {
  try {
    const agency = await requireAgencyKey(request);

    await prisma.agency.update({
      where: { id: agency.agencyId },
      data: { webhookUrl: null, webhookSecret: null },
    });

    return Response.json({ data: { message: 'Webhook removed' } });
  } catch (e: any) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    console.error('[Agency Webhook Config] DELETE error:', e);
    return apiError('Internal server error', 500);
  }
}
