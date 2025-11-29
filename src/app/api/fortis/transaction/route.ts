import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createFortisClient } from '@/lib/fortis/client';
import { dollarsToCents, centsToDollars, calculateFee } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();

    const {
      organizationId,
      donorId,
      amount, // in dollars
      sourceId, // saved payment source ID
      fundId,
      invoiceId,
      paymentLinkId,
      givingSource = 'dashboard',
      isFeeCovered = false,
    } = body;

    // Verify organization access
    const organization = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        userId: currentUser.userId,
      },
      include: {
        fortisOnboarding: true,
      },
    });

    if (!organization || !organization.fortisOnboarding) {
      return NextResponse.json(
        { error: 'Organization not found or not onboarded' },
        { status: 404 }
      );
    }

    // Get donor
    const donor = await prisma.donor.findFirst({
      where: {
        id: donorId,
        organizationId,
      },
    });

    if (!donor) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Get payment source
    const source = await prisma.source.findFirst({
      where: {
        id: sourceId,
        donorId,
        isActive: true,
      },
    });

    if (!source) {
      return NextResponse.json(
        { error: 'Payment source not found' },
        { status: 404 }
      );
    }

    // Calculate fee (example: 2.3% + $0.30 for ActiveBase4)
    const feePercentage = 0.023;
    const feeFixed = 0.30;
    const fee = calculateFee(amount, feePercentage, feeFixed);
    const netAmount = amount - fee;

    // Create transaction record (status='N' initially)
    const transaction = await prisma.transaction.create({
      data: {
        userId: currentUser.userId,
        donorId,
        organizationId,
        totalAmount: amount,
        subTotalAmount: netAmount,
        fee,
        firstName: donor.firstName || '',
        lastName: donor.lastName || '',
        email: donor.email || '',
        phone: donor.phone || '',
        zip: donor.zip || '',
        source: source.sourceType === 'card' ? 'CC' : 'BNK',
        bankType: source.bankType,
        status: 'N', // Not processed yet
        statusAch: source.sourceType === 'bank' ? 'W' : null, // Waiting for ACH
        transactionType: 'Donation',
        givingSource,
        template: organization.fortisTemplate || 'ActiveBase4',
        isFeeCovered,
        invoiceId,
        paymentLinkId,
      },
    });

    // Create fund allocation
    await prisma.transactionFund.create({
      data: {
        transactionId: transaction.id,
        fundId,
        amount,
        fee,
        net: netAmount,
      },
    });

    // Prepare Fortis request
    const amountInCents = dollarsToCents(amount);
    const systemLetterId = 'L'; // LunarPay
    const transactionC1 = `${systemLetterId}-${transaction.id}-${Date.now()}`;
    const transactionC2 = transaction.id.toString();

    const fortisClient = createFortisClient(
      process.env.FORTIS_ENVIRONMENT as 'sandbox' | 'production',
      organization.fortisOnboarding.authUserId!,
      organization.fortisOnboarding.authUserApiKey!
    );

    // Process payment based on source type
    const result = source.sourceType === 'card'
      ? await fortisClient.processCreditCardSale({
          transaction_amount: amountInCents,
          token_id: source.fortisWalletId,
          client_customer_id: donorId.toString(),
          transaction_c1: transactionC1,
          transaction_c2: transactionC2,
        })
      : await fortisClient.processACHDebit({
          transaction_amount: amountInCents,
          token_id: source.fortisWalletId,
          client_customer_id: donorId.toString(),
          transaction_c1: transactionC1,
          transaction_c2: transactionC2,
        });

    // Update transaction with result
    const updateData: any = {
      fortisTransactionId: result.transaction?.id,
      requestResponse: JSON.stringify(result),
      updatedAt: new Date(),
    };

    if (result.status) {
      // Success
      updateData.status = 'P';
      
      // Update donor totals
      await prisma.donor.update({
        where: { id: donorId },
        data: {
          amountAcum: { increment: amount },
          feeAcum: { increment: fee },
          netAcum: { increment: netAmount },
          firstDate: donor.firstDate || new Date(),
        },
      });
    } else {
      // Failed
      updateData.status = 'N';
    }

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: updateData,
    });

    if (result.status) {
      return NextResponse.json({
        status: true,
        transactionId: transaction.id,
        fortisTransactionId: result.transaction?.id,
        message: 'Payment processed successfully',
      });
    } else {
      return NextResponse.json(
        {
          status: false,
          transactionId: transaction.id,
          message: result.message || 'Payment failed',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Transaction processing error:', error);
    
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

