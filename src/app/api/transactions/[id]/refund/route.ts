import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createFortisClient } from '@/lib/fortis/client';
import { dollarsToCents } from '@/lib/utils';
import { logPaymentEvent } from '@/lib/payment-logger';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireAuth();
    const transactionId = parseInt(id);
    const body = await request.json().catch(() => ({}));
    
    // Optional partial refund amount
    const { amount: refundAmount } = body;

    // Verify transaction exists and belongs to user
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        organization: {
          userId: currentUser.userId,
        },
      },
      include: {
        organization: {
          include: {
            fortisOnboarding: true,
          },
        },
        donor: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    if (transaction.status !== 'succeeded' && transaction.status !== 'P') {
      return NextResponse.json(
        { error: 'Only completed transactions can be refunded' },
        { status: 400 }
      );
    }

    // Calculate refund amount
    const totalAmount = Number(transaction.totalAmount);
    const amountToRefund = refundAmount ? Math.min(refundAmount, totalAmount) : totalAmount;
    const isPartialRefund = amountToRefund < totalAmount;

    // Check if we have Fortis transaction ID
    if (!transaction.fortisTransactionId) {
      // No Fortis ID - just update DB (for legacy or test transactions)
      const updatedTransaction = await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: isPartialRefund ? 'partial_refund' : 'refunded',
          refundedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: `${isPartialRefund ? 'Partial refund' : 'Refund'} processed (local only)`,
        transaction: updatedTransaction,
      });
    }

    // Get merchant Fortis credentials
    const fortisOnboarding = transaction.organization.fortisOnboarding;
    
    if (!fortisOnboarding?.authUserId || !fortisOnboarding?.authUserApiKey) {
      return NextResponse.json(
        { error: 'Merchant payment credentials not found' },
        { status: 400 }
      );
    }

    // Create Fortis client with merchant credentials
    const fortisEnv = process.env.fortis_environment || 'dev';
    const env = fortisEnv === 'prd' ? 'production' : 'sandbox';
    const fortisClient = createFortisClient(
      env as 'sandbox' | 'production',
      fortisOnboarding.authUserId,
      fortisOnboarding.authUserApiKey
    );

    // Process refund via Fortis
    const refundAmountCents = dollarsToCents(amountToRefund);
    
    console.log('[Refund] Processing refund:', {
      transactionId,
      fortisTransactionId: transaction.fortisTransactionId,
      amountToRefund,
      refundAmountCents,
      isPartialRefund,
    });

    const result = await fortisClient.refundTransaction(
      transaction.fortisTransactionId,
      refundAmountCents
    );

    console.log('[Refund] Fortis result:', JSON.stringify(result, null, 2));

    // Fortis refund is successful if we got a refund object back or status is true
    // Sometimes Fortis returns successfully but the structure is different
    const refundSucceeded = result.status || result.refund?.id || result.refund;

    if (!refundSucceeded) {
      console.error('[Refund] Fortis refund failed:', result.message);
      
      await logPaymentEvent({
        eventType: 'refund.failed',
        organizationId: transaction.organizationId,
        transactionId: transaction.id,
        amount: amountToRefund,
        error: result.message,
        fortisTransactionId: transaction.fortisTransactionId || undefined,
      });

      return NextResponse.json(
        { error: result.message || 'Refund failed with payment processor' },
        { status: 400 }
      );
    }

    // Update transaction in database
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: isPartialRefund ? 'partial_refund' : 'refunded',
        refundedAt: new Date(),
      },
    });

    // Update donor totals (subtract refunded amount)
    if (transaction.donorId) {
      const refundFee = Number(transaction.fee) * (amountToRefund / totalAmount);
      const refundNet = amountToRefund - refundFee;

      await prisma.donor.update({
        where: { id: transaction.donorId },
        data: {
          amountAcum: { decrement: amountToRefund },
          feeAcum: { decrement: refundFee },
          netAcum: { decrement: refundNet },
        },
      });
    }

    // Log successful refund
    await logPaymentEvent({
      eventType: 'refund.succeeded',
      organizationId: transaction.organizationId,
      transactionId: transaction.id,
      amount: amountToRefund,
      fortisTransactionId: transaction.fortisTransactionId || undefined,
      metadata: {
        isPartialRefund,
        refundId: result.refund?.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: isPartialRefund 
        ? `Partial refund of $${amountToRefund.toFixed(2)} processed successfully` 
        : 'Full refund processed successfully',
      transaction: updatedTransaction,
      refund: {
        amount: amountToRefund,
        isPartial: isPartialRefund,
      },
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Refund error:', error);
    return NextResponse.json(
      { error: 'Failed to process refund' },
      { status: 500 }
    );
  }
}
