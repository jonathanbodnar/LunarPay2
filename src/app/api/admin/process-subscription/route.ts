import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { createFortisClient } from '@/lib/fortis/client';
import { dollarsToCents, calculateFee } from '@/lib/utils';
import { sendSubscriptionRecurringPaymentReceipt } from '@/lib/email';

/**
 * Manually process a specific subscription (for admin use)
 * POST /api/admin/process-subscription
 * Body: { subscriptionId: number }
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'subscriptionId is required' },
        { status: 400 }
      );
    }

    console.log('[Admin] Processing subscription:', subscriptionId);

    // Get subscription
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        donor: true,
        organization: true,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    if (subscription.status !== 'A') {
      return NextResponse.json(
        { error: 'Subscription is not active' },
        { status: 400 }
      );
    }

    // Get organization and Fortis credentials
    const organization = await prisma.organization.findFirst({
      where: { id: subscription.organizationId },
      include: {
        fortisOnboarding: true,
      },
    });

    if (!organization?.fortisOnboarding?.authUserId) {
      return NextResponse.json(
        { error: 'Organization has no Fortis credentials' },
        { status: 400 }
      );
    }

    // Get payment source
    const source = await prisma.source.findFirst({
      where: {
        id: subscription.sourceId,
        isActive: true,
      },
    });

    if (!source) {
      return NextResponse.json(
        { error: 'No active payment source found' },
        { status: 400 }
      );
    }

    console.log('[Admin] Processing $', Number(subscription.amount), 'for subscription', subscriptionId);

    // Calculate fee
    const feePercentage = 0.023;
    const feeFixed = 0.30;
    const fee = calculateFee(Number(subscription.amount), feePercentage, feeFixed);
    const netAmount = Number(subscription.amount) - fee;

    // Create transaction record (with status 'N' initially)
    const transaction = await prisma.transaction.create({
      data: {
        userId: organization.userId,
        donorId: subscription.donorId,
        organizationId: subscription.organizationId,
        subOrganizationId: subscription.subOrganizationId,
        totalAmount: subscription.amount,
        subTotalAmount: netAmount,
        fee,
        firstName: subscription.firstName || subscription.donor?.firstName || '',
        lastName: subscription.lastName || subscription.donor?.lastName || '',
        email: subscription.email || subscription.donor?.email || '',
        source: subscription.source,
        status: 'N',
        transactionType: 'Subscription',
        givingSource: subscription.givingSource,
        template: subscription.template,
        isFeeCovered: subscription.isFeeCovered,
        subscriptionId: subscription.id,
      },
    });

    console.log('[Admin] Created transaction:', transaction.id);

    // Get fund allocation
    const fundAllocation = await prisma.transactionFund.findFirst({
      where: { subscriptionId: subscription.id },
    });

    if (fundAllocation) {
      await prisma.transactionFund.create({
        data: {
          transactionId: transaction.id,
          fundId: fundAllocation.fundId,
          amount: subscription.amount,
          fee,
          net: netAmount,
        },
      });
    }

    // Process payment with Fortis
    const fortisClient = createFortisClient(
      process.env.FORTIS_ENVIRONMENT as 'sandbox' | 'production',
      organization.fortisOnboarding.authUserId,
      organization.fortisOnboarding.authUserApiKey!
    );

    const amountInCents = dollarsToCents(Number(subscription.amount));
    const systemLetterId = 'L';
    const transactionC1 = `${systemLetterId}-${transaction.id}-${Date.now()}`;

    console.log('[Admin] Calling Fortis API with token:', source.fortisWalletId);

    const result = subscription.source === 'CC'
      ? await fortisClient.processCreditCardSale({
          transaction_amount: amountInCents,
          token_id: source.fortisWalletId,
          transaction_c1: transactionC1,
          transaction_c2: transaction.id.toString(),
        })
      : await fortisClient.processACHDebit({
          transaction_amount: amountInCents,
          token_id: source.fortisWalletId,
          transaction_c1: transactionC1,
          transaction_c2: transaction.id.toString(),
        });

    console.log('[Admin] Fortis result:', JSON.stringify(result).substring(0, 500));

    if (result.status) {
      // Update transaction as successful
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'P',
          fortisTransactionId: result.transaction?.id,
          requestResponse: JSON.stringify(result),
        },
      });

      // Update donor totals
      await prisma.donor.update({
        where: { id: subscription.donorId },
        data: {
          amountAcum: { increment: Number(subscription.amount) },
          feeAcum: { increment: fee },
          netAcum: { increment: netAmount },
        },
      });

      // Calculate next payment date
      let nextPaymentDate = new Date(subscription.nextPaymentOn!);
      switch (subscription.frequency) {
        case 'weekly':
        case 'W':
          nextPaymentDate.setDate(nextPaymentDate.getDate() + 7);
          break;
        case 'monthly':
        case 'M':
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
          break;
        case 'quarterly':
        case 'Q':
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 3);
          break;
        case 'yearly':
        case 'Y':
          nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + 1);
          break;
        default:
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
      }

      // Update subscription
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          nextPaymentOn: nextPaymentDate,
          lastPaymentOn: new Date(),
          successTrxns: { increment: 1 },
        },
      });

      // Send receipt email
      try {
        await sendSubscriptionRecurringPaymentReceipt({
          customerName: `${subscription.firstName} ${subscription.lastName}`.trim() || 'Customer',
          customerEmail: subscription.email || subscription.donor?.email || '',
          amount: Number(subscription.amount),
          fee: subscription.isFeeCovered ? fee : 0,
          organizationName: organization.name,
          frequency: subscription.frequency,
          nextPaymentDate: nextPaymentDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          transactionId: transaction.id.toString(),
        });
        console.log('[Admin] Receipt email sent');
      } catch (emailError) {
        console.error('[Admin] Failed to send receipt email:', emailError);
      }

      return NextResponse.json({
        success: true,
        message: 'Subscription payment processed successfully',
        transactionId: Number(transaction.id),
        amount: Number(subscription.amount),
        nextPaymentDate: nextPaymentDate.toISOString(),
        fortisTransactionId: result.transaction?.id,
      });
    } else {
      // Update transaction as failed
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'N',
          requestResponse: JSON.stringify(result),
        },
      });

      // Update fail count
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          failTrxns: { increment: 1 },
        },
      });

      return NextResponse.json({
        success: false,
        error: result.message || 'Payment failed',
        details: result,
      });
    }
  } catch (error) {
    if ((error as Error).message === 'AdminUnauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Admin] Process subscription error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    );
  }
}
