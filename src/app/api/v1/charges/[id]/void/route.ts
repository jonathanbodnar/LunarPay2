/**
 * POST /api/v1/charges/:id/void — Void a charge before settlement
 *
 * Use this to:
 *   - Release an authorization hold (charge status: authorized) without
 *     capturing any of the funds.
 *   - Cancel a captured sale on the same day before it settles in the daily
 *     batch. After settlement, use POST /api/v1/charges/:id/refund instead.
 *
 * Voids carry no Fortis fee and do not appear on the customer's statement;
 * refunds do.
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createFortisClient } from '@/lib/fortis/client';
import { requireSecretKey, ApiAuthError, apiError } from '@/lib/api-auth';

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
    if (transaction.status === 'V') return apiError('This charge has already been voided', 400);
    if (transaction.status === 'R') return apiError('This charge has been refunded and cannot be voided', 400);
    if (transaction.status !== 'A' && transaction.status !== 'P') {
      return apiError('Only authorized or paid charges can be voided', 400);
    }
    if (!transaction.fortisTransactionId) {
      return apiError('This charge cannot be voided via API (no processor transaction ID)', 400);
    }

    const fortisEnv = process.env.fortis_environment || 'dev';
    const env = fortisEnv === 'prd' ? 'production' : 'sandbox';
    const fortisClient = createFortisClient(env as 'sandbox' | 'production', auth.fortisUserId, auth.fortisApiKey);

    const result = await fortisClient.voidTransaction(transaction.fortisTransactionId);

    if (!result.status) {
      // Fortis rejects voids after settlement — surface a helpful hint.
      const msg = (result.message || '').toLowerCase();
      const alreadySettled =
        msg.includes('already') ||
        msg.includes('settle') ||
        msg.includes('batch') ||
        msg.includes('data validation');
      return apiError(
        alreadySettled
          ? 'This charge has already settled and can no longer be voided. Use POST /api/v1/charges/:id/refund instead.'
          : result.message || 'Void failed',
        400
      );
    }

    const wasCapturedSale = transaction.status === 'P';

    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'V',
        transactionType: 'void',
        requestResponse: JSON.stringify(result.transaction),
      },
    });

    // If we're voiding a captured sale (not just releasing an auth hold), back
    // out the amount we previously rolled into the customer's lifetime total.
    if (wasCapturedSale && transaction.donorId) {
      await prisma.donor.update({
        where: { id: transaction.donorId },
        data: {
          amountAcum: { decrement: Number(transaction.totalAmount) },
        },
      });
    }

    return Response.json({
      data: {
        id,
        status: 'voided',
        priorStatus: transaction.status === 'A' ? 'authorized' : 'paid',
      },
    });
  } catch (e) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    console.error('[v1/charges/void POST]', e);
    return apiError('Internal server error', 500);
  }
}
