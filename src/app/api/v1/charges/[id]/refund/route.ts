/**
 * POST /api/v1/charges/:id/refund — Refund a charge
 *
 * Body:
 *   amount  number?  — Amount in cents to refund (omit for full refund)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createFortisClient } from '@/lib/fortis/client';
import { requireSecretKey, ApiAuthError, apiError } from '@/lib/api-auth';

const refundSchema = z.object({
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
    if (transaction.status === 'R') return apiError('This charge has already been refunded', 400);
    if (transaction.status !== 'P') return apiError('Only paid charges can be refunded', 400);
    if (!transaction.fortisTransactionId) {
      return apiError('This charge cannot be refunded via API (no processor transaction ID)', 400);
    }

    const body = await request.json().catch(() => ({}));
    const parsed = refundSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation error', 400, parsed.error.flatten().fieldErrors);
    }

    const totalCents = Math.round(Number(transaction.totalAmount) * 100);
    const refundCents = parsed.data.amount ?? totalCents;

    if (refundCents > totalCents) {
      return apiError(`Refund amount ($${(refundCents / 100).toFixed(2)}) exceeds charge amount ($${(totalCents / 100).toFixed(2)})`, 400);
    }

    const fortisEnv = process.env.fortis_environment || 'dev';
    const env = fortisEnv === 'prd' ? 'production' : 'sandbox';
    const fortisClient = createFortisClient(env as 'sandbox' | 'production', auth.fortisUserId, auth.fortisApiKey);

    const result = await fortisClient.refundTransaction(transaction.fortisTransactionId, refundCents);

    if (!result.status) {
      return apiError(result.message || 'Refund failed', 400);
    }

    const isFullRefund = refundCents === totalCents;

    await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: isFullRefund ? 'R' : 'P' },
    });

    if (transaction.donorId && isFullRefund) {
      await prisma.donor.update({
        where: { id: transaction.donorId },
        data: { amountAcum: { decrement: Number(transaction.totalAmount) } },
      });
    }

    return Response.json({
      data: {
        chargeId: id,
        refundedAmount: refundCents,
        fullRefund: isFullRefund,
        status: isFullRefund ? 'refunded' : 'partially_refunded',
      },
    });
  } catch (e) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    console.error('[v1/charges/refund POST]', e);
    return apiError('Internal server error', 500);
  }
}
