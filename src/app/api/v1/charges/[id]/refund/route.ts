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
import { deliverWebhook } from '@/lib/webhook';

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
    const alreadyRefundedCents = Math.round(Number(transaction.refundedAmount ?? 0) * 100);
    const remainingCents = totalCents - alreadyRefundedCents;

    // Default to what's LEFT, not the original total — on a charge with an
    // existing partial refund, an amount-less call used to send the full
    // amount to Fortis a second time.
    const refundCents = parsed.data.amount ?? remainingCents;

    if (remainingCents <= 0) {
      return apiError('This charge has already been fully refunded', 400);
    }

    if (refundCents > remainingCents) {
      return apiError(
        `Refund amount ($${(refundCents / 100).toFixed(2)}) exceeds the refundable balance ` +
          `($${(remainingCents / 100).toFixed(2)} of $${(totalCents / 100).toFixed(2)} remaining ` +
          `after $${(alreadyRefundedCents / 100).toFixed(2)} already refunded)`,
        400,
      );
    }

    const totalRefundedCents = alreadyRefundedCents + refundCents;
    // "Full" means the charge is now exhausted, whether that took one refund or
    // five — previously only a single-shot full refund ever reached status 'R',
    // so a charge refunded in two halves stayed 'P' forever.
    const isFullyRefunded = totalRefundedCents >= totalCents;

    // Reserve the balance BEFORE calling Fortis. Checking the running total and
    // then writing it back afterwards leaves the window this column exists to
    // close: two concurrent refunds both read $0 refunded, both pass the
    // balance check, and both send a full refund to the processor. The
    // conditional update is the lock — it only matches while refunded_amount is
    // still the value this request read, so exactly one caller proceeds.
    const reserved = await prisma.transaction.updateMany({
      where: {
        id: transactionId,
        organizationId: auth.organizationId,
        refundedAmount: alreadyRefundedCents / 100,
      },
      data: { refundedAmount: totalRefundedCents / 100 },
    });

    if (reserved.count === 0) {
      return apiError(
        'Another refund for this charge is already in progress. Re-read the charge and retry.',
        409,
      );
    }

    const fortisEnv = process.env.fortis_environment || 'dev';
    const env = fortisEnv === 'prd' ? 'production' : 'sandbox';
    const fortisClient = createFortisClient(env as 'sandbox' | 'production', auth.fortisUserId, auth.fortisApiKey);

    const result = await fortisClient.refundTransaction(transaction.fortisTransactionId, refundCents);

    if (!result.status) {
      // Release the reservation so a corrected retry isn't blocked by a refund
      // that never happened. Conditional again so a concurrent winner's value
      // is never clobbered.
      await prisma.transaction.updateMany({
        where: { id: transactionId, refundedAmount: totalRefundedCents / 100 },
        data: { refundedAmount: alreadyRefundedCents / 100 },
      });
      return apiError(result.message || 'Refund failed', 400);
    }

    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: isFullyRefunded ? 'R' : 'P',
        ...(isFullyRefunded ? { refundedAt: new Date() } : {}),
      },
    });

    // Back out what was actually returned. This used to fire only on a full
    // refund, so partials silently overstated the customer's lifetime total.
    // Incremental decrements sum to the same figure a single full refund gives.
    if (transaction.donorId) {
      await prisma.donor.update({
        where: { id: transaction.donorId },
        data: { amountAcum: { decrement: refundCents / 100 } },
      });
    }

    // Notify the merchant's webhook so mirrors track refunds, full and partial.
    // The running totals are carried on the event too, so a receiver that
    // missed an earlier delivery can still reconcile from a single message.
    const org = await prisma.organization.findUnique({
      where: { id: auth.organizationId },
      select: { webhookUrl: true, webhookSecret: true },
    });
    await deliverWebhook(
      org?.webhookUrl,
      org?.webhookSecret,
      'payment.refunded',
      auth.organizationId,
      {
        transaction_id: transactionId.toString(),
        customer_id: transaction.donorId,
        refunded_amount_cents: refundCents,
        total_refunded_cents: totalRefundedCents,
        remaining_refundable_cents: totalCents - totalRefundedCents,
        amount_cents: totalCents,
        full_refund: isFullyRefunded,
        currency: 'USD',
      },
    );

    return Response.json({
      data: {
        chargeId: id,
        refundedAmount: refundCents,
        totalRefunded: totalRefundedCents,
        remainingRefundable: totalCents - totalRefundedCents,
        amount: totalCents,
        fullRefund: isFullyRefunded,
        status: isFullyRefunded ? 'refunded' : 'partially_refunded',
      },
    });
  } catch (e) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    console.error('[v1/charges/refund POST]', e);
    return apiError('Internal server error', 500);
  }
}
