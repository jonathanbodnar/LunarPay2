import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createFortisClient } from '@/lib/fortis/client';
import { dollarsToCents, calculateFee } from '@/lib/utils';
import { logPaymentEvent } from '@/lib/payment-logger';

/**
 * POST /api/customers/:id/charge
 * Charge a customer using their saved payment method
 * 
 * Request body:
 * - sourceId: ID of the saved payment source
 * - amount: Amount to charge (in dollars)
 * - description: Optional description
 * - fundId: Optional fund allocation
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireAuth();
    const customerId = parseInt(id);
    const body = await request.json();

    const { sourceId, amount, description, fundId } = body;

    if (!sourceId || !amount) {
      return NextResponse.json(
        { error: 'Source ID and amount are required' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Verify customer belongs to user's organization
    const customer = await prisma.donor.findFirst({
      where: {
        id: customerId,
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
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Verify payment source exists and belongs to customer
    const source = await prisma.source.findFirst({
      where: {
        id: sourceId,
        donorId: customerId,
        isActive: true,
      },
    });

    if (!source) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      );
    }

    if (!source.fortisWalletId) {
      return NextResponse.json(
        { error: 'Payment method is not tokenized for processing' },
        { status: 400 }
      );
    }

    // Check merchant is active
    const fortisOnboarding = customer.organization.fortisOnboarding;
    if (!fortisOnboarding?.authUserId || !fortisOnboarding?.authUserApiKey) {
      return NextResponse.json(
        { error: 'Merchant payment processing is not configured' },
        { status: 400 }
      );
    }

    // Calculate fee
    const fee = calculateFee(amount, 0.023, 0.30);
    const netAmount = amount - fee;

    // Create transaction record (pending)
    const transaction = await prisma.transaction.create({
      data: {
        userId: currentUser.userId,
        organizationId: customer.organizationId,
        donorId: customerId,
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        email: customer.email || '',
        totalAmount: amount,
        subTotalAmount: netAmount,
        fee,
        source: source.sourceType === 'ach' ? 'ACH' : 'CC',
        status: 'N', // Pending
        transactionType: 'Payment',
        template: 'lunarpayfr',
        givingSource: 'merchant_charge',
      },
    });

    // Create fund allocation if specified
    if (fundId) {
      await prisma.transactionFund.create({
        data: {
          transactionId: transaction.id,
          fundId,
          amount,
          fee,
          net: netAmount,
        },
      });
    }

    // Create Fortis client with merchant credentials
    const fortisEnv = process.env.fortis_environment || 'dev';
    const env = fortisEnv === 'prd' ? 'production' : 'sandbox';
    const fortisClient = createFortisClient(
      env as 'sandbox' | 'production',
      fortisOnboarding.authUserId,
      fortisOnboarding.authUserApiKey
    );

    // Process payment
    const amountInCents = dollarsToCents(amount);
    const transactionC1 = `LP-${transaction.id}-${Date.now()}`;

    console.log('[Charge Customer] Processing:', {
      customerId,
      sourceId,
      amount,
      amountInCents,
      sourceType: source.sourceType,
    });

    const result = source.sourceType === 'ach'
      ? await fortisClient.processACHDebit({
          transaction_amount: amountInCents,
          token_id: source.fortisWalletId,
          client_customer_id: customerId.toString(),
          transaction_c1: transactionC1,
          transaction_c2: transaction.id.toString(),
        })
      : await fortisClient.processCreditCardSale({
          transaction_amount: amountInCents,
          token_id: source.fortisWalletId,
          client_customer_id: customerId.toString(),
          transaction_c1: transactionC1,
          transaction_c2: transaction.id.toString(),
        });

    if (result.status) {
      // Success - update transaction
      const isPending = source.sourceType === 'ach';
      
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: isPending ? 'pending' : 'succeeded',
          statusAch: isPending ? 'pending' : null,
          fortisTransactionId: result.transaction?.id,
          requestResponse: JSON.stringify(result),
        },
      });

      // Update donor totals (for CC, or for ACH when confirmed via webhook)
      if (!isPending) {
        await prisma.donor.update({
          where: { id: customerId },
          data: {
            amountAcum: { increment: amount },
            feeAcum: { increment: fee },
            netAcum: { increment: netAmount },
          },
        });
      }

      await logPaymentEvent({
        eventType: isPending ? 'ach.pending' : 'payment.succeeded',
        organizationId: customer.organizationId,
        transactionId: transaction.id,
        amount,
        fortisTransactionId: result.transaction?.id,
        metadata: {
          customerId,
          sourceId,
        },
      });

      return NextResponse.json({
        success: true,
        message: isPending 
          ? 'ACH payment initiated. Bank transfer is being processed.'
          : 'Payment processed successfully',
        transaction: {
          id: transaction.id,
          amount,
          status: isPending ? 'pending' : 'succeeded',
          fortisTransactionId: result.transaction?.id,
        },
      });
    } else {
      // Failed - update transaction
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'failed',
          requestResponse: JSON.stringify(result),
        },
      });

      await logPaymentEvent({
        eventType: 'payment.failed',
        organizationId: customer.organizationId,
        transactionId: transaction.id,
        amount,
        error: result.message,
        metadata: {
          customerId,
          sourceId,
          reasonCode: result.reasonCode,
        },
      });

      return NextResponse.json({
        success: false,
        error: result.message || 'Payment failed',
        reasonCode: result.reasonCode,
        transactionId: transaction.id,
      });
    }
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Charge customer error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}

