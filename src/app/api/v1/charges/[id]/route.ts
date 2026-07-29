/**
 * GET /api/v1/charges/:id — Fetch a single charge, including refund state.
 *
 * Merchants previously had no way to read a charge back after creating it,
 * which made mirror reconciliation impossible. Status vocabulary matches the
 * list endpoint: paid | failed | refunded | pending | authorized | voided.
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSecretKey, ApiAuthError, apiError } from '@/lib/api-auth';

function chargeStatusLabel(status: string): string {
  switch (status) {
    case 'P': return 'paid';
    case 'N': return 'failed';
    case 'R': return 'refunded';
    case 'U': return 'pending';
    case 'A': return 'authorized';
    case 'V': return 'voided';
    default: return status;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSecretKey(request);
    const { id } = await params;
    let transactionId: bigint;
    try {
      transactionId = BigInt(id);
    } catch {
      return apiError('Invalid charge ID', 400);
    }

    const t = await prisma.transaction.findFirst({
      where: { id: transactionId, organizationId: auth.organizationId },
      select: {
        id: true, donorId: true, totalAmount: true, subTotalAmount: true,
        fee: true, status: true, source: true, subscriptionId: true,
        fortisTransactionId: true, createdAt: true, refundedAt: true,
        refundedAmount: true,
      },
    });
    if (!t) return apiError('Charge not found', 404);

    const amountCents = Math.round(Number(t.totalAmount) * 100);
    const refundedCents = Math.round(Number(t.refundedAmount ?? 0) * 100);

    return Response.json({
      data: {
        id: t.id.toString(),
        customerId: t.donorId,
        amount: amountCents,
        subTotalAmount: Math.round(Number(t.subTotalAmount) * 100),
        fee: Math.round(Number(t.fee) * 100),
        status: chargeStatusLabel(t.status),
        paymentMethod: t.source === 'BNK' ? 'ach' : 'cc',
        subscriptionId: t.subscriptionId,
        fortisTransactionId: t.fortisTransactionId,
        createdAt: t.createdAt,
        refundedAt: t.refundedAt,
        // Running refund state, so a partial is visible here rather than only
        // in the payment.refunded webhook the caller may have missed.
        refundedAmount: refundedCents,
        remainingRefundable: Math.max(0, amountCents - refundedCents),
      },
    });
  } catch (e) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    console.error('[v1/charges/:id GET]', e);
    return apiError('Internal server error', 500);
  }
}
