/**
 * POST /api/v1/charges/:id/capture — Capture (settle) a previously authorized charge
 *
 * Body:
 *   amount  number?  — Amount in cents to capture (omit to capture the full
 *                       authorized amount). Partial capture is allowed: the
 *                       captured amount becomes the charge's final totalAmount.
 *
 * Use this on a charge created with capture: false (auth-only hold). Must be
 * called within Fortis's authorization window (typically 7 days). To release a
 * hold without charging, use POST /api/v1/charges/:id/void instead.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createFortisClient } from '@/lib/fortis/client';
import { requireSecretKey, ApiAuthError, apiError } from '@/lib/api-auth';

const captureSchema = z.object({
  amount: z.number().int().positive().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSecretKey(request);
    const { id } = await params;
    const transactionId = BigInt(id);

    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, organizationId: auth.organizationId },
    });

    if (!transaction) return apiError('Charge not found', 404);
    if (transaction.status === 'P') return apiError('This charge has already been captured', 400);
    if (transaction.status === 'V') return apiError('This charge has been voided and cannot be captured', 400);
    if (transaction.status !== 'A') {
      return apiError('Only authorized (auth-only) charges can be captured', 400);
    }
    if (!transaction.fortisTransactionId) {
      return apiError('This charge cannot be captured via API (no processor transaction ID)', 400);
    }

    const body = await request.json().catch(() => ({}));
    const parsed = captureSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation error', 400, parsed.error.flatten().fieldErrors);
    }

    const authorizedCents = Math.round(Number(transaction.totalAmount) * 100);
    const captureCents = parsed.data.amount ?? authorizedCents;

    if (captureCents > authorizedCents) {
      return apiError(
        `Capture amount ($${(captureCents / 100).toFixed(2)}) exceeds authorized amount ($${(authorizedCents / 100).toFixed(2)}). Use POST /api/v1/transactions/${id}/auth-increment to increase the hold first.`,
        400
      );
    }

    const fortisEnv = process.env.fortis_environment || 'dev';
    const env = fortisEnv === 'prd' ? 'production' : 'sandbox';
    const fortisClient = createFortisClient(env as 'sandbox' | 'production', auth.fortisUserId, auth.fortisApiKey);

    const result = await fortisClient.captureAuthorization(transaction.fortisTransactionId, captureCents);

    if (!result.status) {
      return apiError(result.message || 'Capture failed', 402);
    }

    const captureDollars = captureCents / 100;
    const isPartial = captureCents < authorizedCents;

    // Update the original transaction: mark as paid, store the captured amount
    // as the new totalAmount/subTotalAmount so reports reflect what actually
    // settled (not what was originally held).
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'P',
        totalAmount: captureDollars,
        subTotalAmount: captureDollars,
        transactionType: isPartial ? 'authcomplete_partial' : 'authcomplete',
        requestResponse: JSON.stringify(result.transaction),
      },
    });

    // Roll the captured amount into the customer's lifetime total now that the
    // money actually moves. (The original auth-only insert skipped this.)
    if (transaction.donorId) {
      await prisma.donor.update({
        where: { id: transaction.donorId },
        data: {
          amountAcum: { increment: captureDollars },
          firstDate: transaction.date ?? new Date(),
        },
      });
    }

    return Response.json({
      data: {
        id,
        capturedAmount: captureCents,
        authorizedAmount: authorizedCents,
        partial: isPartial,
        status: 'paid',
      },
    });
  } catch (e) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    console.error('[v1/charges/capture POST]', e);
    return apiError('Internal server error', 500);
  }
}
