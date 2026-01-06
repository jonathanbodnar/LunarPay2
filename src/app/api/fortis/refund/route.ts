import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createFortisClient } from '@/lib/fortis/client';
import { dollarsToCents } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();

    const { transactionId } = body;

    // Get transaction
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: BigInt(transactionId),
        userId: currentUser.userId,
      },
      include: {
        donor: true,
        transactionFunds: {
          include: {
            fund: true,
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Check if already refunded
    if (transaction.status === 'R') {
      return NextResponse.json(
        { error: 'Transaction already refunded' },
        { status: 400 }
      );
    }

    // Check if has Fortis transaction ID
    if (!transaction.fortisTransactionId) {
      return NextResponse.json(
        { error: 'Cannot refund: No processor transaction ID' },
        { status: 400 }
      );
    }

    // Get organization with Fortis credentials
    const organization = await prisma.organization.findFirst({
      where: { id: transaction.organizationId },
      include: {
        fortisOnboarding: true,
      },
    });

    if (!organization?.fortisOnboarding?.authUserId) {
      return NextResponse.json(
        { error: 'Merchant credentials not found' },
        { status: 404 }
      );
    }

    // Create Fortis client with merchant credentials
    const fortisClient = createFortisClient(
      process.env.FORTIS_ENVIRONMENT as 'sandbox' | 'production',
      organization.fortisOnboarding.authUserId,
      organization.fortisOnboarding.authUserApiKey!
    );

    // Process refund
    const amountInCents = dollarsToCents(Number(transaction.totalAmount));
    const result = await fortisClient.refundTransaction(
      transaction.fortisTransactionId,
      amountInCents
    );

    if (!result.status) {
      return NextResponse.json(
        { error: result.message || 'Refund failed' },
        { status: 400 }
      );
    }

    // Create refund transaction record
    const refundTransaction = await prisma.transaction.create({
      data: {
        userId: currentUser.userId,
        donorId: transaction.donorId,
        organizationId: transaction.organizationId,
        subOrganizationId: transaction.subOrganizationId,
        totalAmount: -Number(transaction.totalAmount),
        subTotalAmount: -Number(transaction.totalAmount),
        fee: 0,
        firstName: transaction.firstName,
        lastName: transaction.lastName,
        email: transaction.email,
        phone: transaction.phone,
        zip: transaction.zip,
        source: transaction.source,
        bankType: transaction.bankType,
        status: 'P',
        transactionType: 'RE', // Refund
        givingSource: transaction.givingSource,
        template: transaction.template,
        isFeeCovered: false,
        trxRetOriginId: transaction.id,
        fortisTransactionId: result.refund?.id,
        requestResponse: JSON.stringify(result),
        date: new Date(),
      },
    });

    // Create negative fund allocations
    for (const fund of transaction.transactionFunds) {
      await prisma.transactionFund.create({
        data: {
          transactionId: refundTransaction.id,
          fundId: fund.fundId,
          amount: -Number(fund.amount),
          fee: 0,
          net: -Number(fund.amount),
        },
      });
    }

    // Update original transaction
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'R', // Refunded
        trxRetId: refundTransaction.id,
      },
    });

    // Update donor totals
    await prisma.donor.update({
      where: { id: transaction.donorId },
      data: {
        amountAcum: { decrement: Number(transaction.totalAmount) },
        feeAcum: { decrement: Number(transaction.fee) },
        netAcum: { decrement: Number(transaction.subTotalAmount) },
      },
    });

    return NextResponse.json({
      status: true,
      refundTransactionId: refundTransaction.id,
      message: 'Refund processed successfully',
    });
  } catch (error) {
    console.error('Refund error:', error);
    
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

