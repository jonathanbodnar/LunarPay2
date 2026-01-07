import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPortalSession } from '@/lib/portal-auth';
import { createFortisClient } from '@/lib/fortis/client';
import { dollarsToCents, calculateFee } from '@/lib/utils';
import { logPaymentEvent } from '@/lib/payment-logger';

// POST /api/portal/checkout - Process a purchase or subscription
export async function POST(request: Request) {
  try {
    const session = await getPortalSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId, paymentMethodId } = body;

    if (!productId || !paymentMethodId) {
      return NextResponse.json(
        { error: 'Product and payment method are required' },
        { status: 400 }
      );
    }

    // Get the product
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        organizationId: session.organizationId,
        showOnPortal: true,
        trash: false,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get the payment method (verify it belongs to this customer)
    const paymentMethod = await prisma.source.findFirst({
      where: {
        id: paymentMethodId,
        donorId: session.customerId,
        organizationId: session.organizationId,
        isActive: true,
      },
    });

    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      );
    }

    if (!paymentMethod.fortisWalletId) {
      return NextResponse.json(
        { error: 'Payment method is not configured for processing' },
        { status: 400 }
      );
    }

    // Get organization with Fortis credentials
    const organization = await prisma.organization.findUnique({
      where: { id: session.organizationId },
      include: {
        fortisOnboarding: true,
      },
    });

    if (!organization?.fortisOnboarding?.authUserId) {
      return NextResponse.json(
        { error: 'Payment processing is not configured for this merchant' },
        { status: 400 }
      );
    }

    // Get customer info
    const customer = await prisma.donor.findUnique({
      where: { id: session.customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const amount = Number(product.price);
    const fee = calculateFee(amount, 0.023, 0.30);
    const netAmount = amount - fee;

    console.log('[PORTAL CHECKOUT] Processing purchase:', {
      customerId: session.customerId,
      productId: product.id,
      productName: product.name,
      price: amount,
      isSubscription: product.isSubscription,
      paymentMethodId: paymentMethod.id,
    });

    // For subscriptions with trial period, don't charge now
    const hasTrialPeriod = product.isSubscription && product.subscriptionTrialDays && product.subscriptionTrialDays > 0;
    
    if (hasTrialPeriod) {
      // Create subscription without charging (first charge on trial end)
      const nextPaymentDate = new Date();
      nextPaymentDate.setDate(nextPaymentDate.getDate() + (product.subscriptionTrialDays || 0));

      const subscription = await prisma.subscription.create({
        data: {
          organizationId: session.organizationId,
          donorId: session.customerId,
          sourceId: paymentMethod.id,
          firstName: customer.firstName || '',
          lastName: customer.lastName || '',
          email: customer.email || '',
          amount,
          frequency: mapInterval(product.subscriptionInterval),
          status: 'A',
          startOn: new Date(),
          nextPaymentOn: nextPaymentDate,
          source: paymentMethod.sourceType === 'ach' ? 'ACH' : 'CC',
          givingSource: 'portal',
          template: 'lunarpayfr',
        },
      });

      return NextResponse.json({
        success: true,
        message: `Subscription started with ${product.subscriptionTrialDays} day trial`,
        subscription: {
          id: subscription.id,
          productName: product.name,
          amount,
          interval: product.subscriptionInterval,
          nextPaymentDate: nextPaymentDate.toISOString(),
          trialDays: product.subscriptionTrialDays,
        },
      });
    }

    // Create Fortis client with merchant credentials
    const fortisEnv = process.env.fortis_environment || 'dev';
    const env = fortisEnv === 'prd' ? 'production' : 'sandbox';
    const fortisClient = createFortisClient(
      env as 'sandbox' | 'production',
      organization.fortisOnboarding.authUserId,
      organization.fortisOnboarding.authUserApiKey!
    );

    // Create transaction record (pending)
    const transaction = await prisma.transaction.create({
      data: {
        userId: organization.userId,
        organizationId: session.organizationId,
        donorId: session.customerId,
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        email: customer.email || '',
        totalAmount: amount,
        subTotalAmount: netAmount,
        fee,
        source: paymentMethod.sourceType === 'ach' ? 'ACH' : 'CC',
        status: 'N',
        transactionType: product.isSubscription ? 'Subscription' : 'Payment',
        givingSource: 'portal',
        template: 'lunarpayfr',
      },
    });

    // Process payment
    const amountInCents = dollarsToCents(amount);
    const transactionC1 = `PORTAL-${transaction.id}-${Date.now()}`;

    // Note: client_customer_id is not allowed by Fortis API, removed from request
    const result = paymentMethod.sourceType === 'ach'
      ? await fortisClient.processACHDebit({
          transaction_amount: amountInCents,
          token_id: paymentMethod.fortisWalletId,
          transaction_c1: transactionC1,
          transaction_c2: transaction.id.toString(),
        })
      : await fortisClient.processCreditCardSale({
          transaction_amount: amountInCents,
          token_id: paymentMethod.fortisWalletId,
          transaction_c1: transactionC1,
          transaction_c2: transaction.id.toString(),
        });

    if (result.status) {
      const isPending = paymentMethod.sourceType === 'ach';

      // Update transaction
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: isPending ? 'pending' : 'succeeded',
          statusAch: isPending ? 'pending' : null,
          fortisTransactionId: result.transaction?.id,
          requestResponse: JSON.stringify(result),
        },
      });

      // Update donor totals for CC (ACH updates via webhook)
      if (!isPending) {
        await prisma.donor.update({
          where: { id: session.customerId },
          data: {
            amountAcum: { increment: amount },
            feeAcum: { increment: fee },
            netAcum: { increment: netAmount },
          },
        });
      }

      // If subscription, create subscription record
      if (product.isSubscription) {
        const nextPaymentDate = new Date();
        switch (product.subscriptionInterval) {
          case 'W':
            nextPaymentDate.setDate(nextPaymentDate.getDate() + 7 * (product.subscriptionIntervalCount || 1));
            break;
          case 'M':
            nextPaymentDate.setMonth(nextPaymentDate.getMonth() + (product.subscriptionIntervalCount || 1));
            break;
          case 'Y':
            nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + (product.subscriptionIntervalCount || 1));
            break;
          default:
            nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
        }

        await prisma.subscription.create({
          data: {
            organizationId: session.organizationId,
            donorId: session.customerId,
            sourceId: paymentMethod.id,
            firstName: customer.firstName || '',
            lastName: customer.lastName || '',
            email: customer.email || '',
            amount,
            frequency: mapInterval(product.subscriptionInterval),
            status: 'A',
            startOn: new Date(),
            nextPaymentOn: nextPaymentDate,
            lastPaymentOn: new Date(),
            source: paymentMethod.sourceType === 'ach' ? 'ACH' : 'CC',
            givingSource: 'portal',
            template: 'lunarpayfr',
            successTrxns: 1,
          },
        });
      }

      await logPaymentEvent({
        eventType: isPending ? 'ach.pending' : 'payment.succeeded',
        organizationId: session.organizationId,
        transactionId: transaction.id,
        amount,
        metadata: {
          productId: product.id,
          productName: product.name,
          isSubscription: product.isSubscription,
        },
      });

      return NextResponse.json({
        success: true,
        message: isPending
          ? 'Payment initiated. Bank transfer is being processed.'
          : product.isSubscription
            ? 'Subscription started successfully'
            : 'Purchase completed successfully',
        transaction: {
          id: transaction.id,
          status: isPending ? 'pending' : 'succeeded',
        },
        purchase: {
          productName: product.name,
          amount,
          isSubscription: product.isSubscription,
        },
      });
    } else {
      // Payment failed
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'failed',
          requestResponse: JSON.stringify(result),
        },
      });

      await logPaymentEvent({
        eventType: 'payment.failed',
        organizationId: session.organizationId,
        transactionId: transaction.id,
        error: result.message,
        metadata: {
          productId: product.id,
          reasonCode: result.reasonCode,
        },
      });

      return NextResponse.json({
        success: false,
        error: result.message || 'Payment failed',
      });
    }
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to process checkout', details: String(error) },
      { status: 500 }
    );
  }
}

// Helper to map subscription interval to frequency
function mapInterval(interval: string | null): string {
  switch (interval) {
    case 'W': return 'weekly';
    case 'M': return 'monthly';
    case 'Q': return 'quarterly';
    case 'Y': return 'yearly';
    default: return 'monthly';
  }
}
