import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPortalSession } from '@/lib/portal-auth';
import { createFortisClient } from '@/lib/fortis/client';
import { dollarsToCents, calculateFee } from '@/lib/utils';
import { logPaymentEvent } from '@/lib/payment-logger';

/**
 * POST /api/portal/checkout/process-ticket
 * Process ticket sale for new card checkout
 */
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
    const { ticketId, productId, saveCard = true } = body;

    if (!ticketId || !productId) {
      return NextResponse.json(
        { error: 'Ticket ID and Product ID are required' },
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

    const amount = Number(product.price);
    const amountInCents = dollarsToCents(amount);
    const fee = calculateFee(amount, 0.023, 0.30);
    const netAmount = amount - fee;

    console.log('[Portal Checkout Ticket] Processing:', {
      customerId: session.customerId,
      productId: product.id,
      ticketId,
      amount,
      isSubscription: product.isSubscription,
    });

    // For subscriptions with trial period, don't charge now
    const hasTrialPeriod = product.isSubscription && product.subscriptionTrialDays && product.subscriptionTrialDays > 0;

    // Create Fortis client
    const fortisEnv = process.env.fortis_environment || 'dev';
    const env = fortisEnv === 'prd' ? 'production' : 'sandbox';
    const fortisClient = createFortisClient(
      env as 'sandbox' | 'production',
      organization.fortisOnboarding.authUserId,
      organization.fortisOnboarding.authUserApiKey!
    );

    // Process ticket sale with save_account: true
    const result = await fortisClient.processTicketSale({
      ticket_id: ticketId,
      transaction_amount: hasTrialPeriod ? 0 : amountInCents, // $0 for trial
      save_account: true,
      location_id: organization.fortisOnboarding.locationId || undefined,
      transaction_c1: `PORTAL-${session.customerId}-${Date.now()}`,
    });

    console.log('[Portal Checkout Ticket] Fortis result:', {
      status: result.status,
      tokenId: result.tokenId,
      transactionId: result.transaction?.id,
    });

    if (!result.status) {
      await logPaymentEvent({
        eventType: 'payment.failed',
        organizationId: session.organizationId,
        metadata: {
          customerId: session.customerId,
          productId: product.id,
          ticketId,
          error: result.message,
        },
      });

      return NextResponse.json({
        success: false,
        error: result.message || 'Payment was declined',
      });
    }

    const txData = result.transaction || {};
    const tokenId = result.tokenId;
    const fortisTransactionId = txData.id;

    // Extract card info
    const last_four = txData.last_four || txData.last4 || '';
    const account_holder_name = txData.account_holder_name || customer.firstName + ' ' + customer.lastName || '';
    const account_type = txData.account_type || '';
    const payment_method = txData.payment_method || 'cc';
    const exp_date = txData.exp_date || '';

    // Save payment method
    let savedSourceId: number | null = null;
    if (tokenId && saveCard) {
      const existingSource = await prisma.source.findFirst({
        where: { fortisWalletId: tokenId, donorId: session.customerId },
      });

      if (!existingSource) {
        let expMonth: string | null = null;
        let expYear: string | null = null;
        if (exp_date && exp_date.length === 4) {
          expMonth = exp_date.substring(0, 2);
          expYear = '20' + exp_date.substring(2, 4);
        }

        // Check if customer has any other payment methods
        const existingMethods = await prisma.source.count({
          where: {
            donorId: session.customerId,
            organizationId: session.organizationId,
            isActive: true,
          },
        });

        const newSource = await prisma.source.create({
          data: {
            donorId: session.customerId,
            organizationId: session.organizationId,
            sourceType: payment_method === 'ach' ? 'ach' : 'cc',
            bankType: account_type || null,
            lastDigits: last_four || '',
            nameHolder: account_holder_name || '',
            expMonth,
            expYear,
            isDefault: existingMethods === 0, // Default if first method
            isActive: true,
            isSaved: true,
            fortisWalletId: tokenId,
            fortisCustomerId: session.customerId.toString(),
          },
        });
        savedSourceId = newSource.id;
        console.log('[Portal Checkout Ticket] Saved card:', { sourceId: newSource.id, tokenId });
      } else {
        savedSourceId = existingSource.id;
      }
    }

    // Create transaction record (if not trial)
    let transaction = null;
    if (!hasTrialPeriod) {
      transaction = await prisma.transaction.create({
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
          source: payment_method === 'ach' ? 'ACH' : 'CC',
          status: 'P',
          transactionType: product.isSubscription ? 'Subscription' : 'Payment',
          givingSource: 'portal',
          fortisTransactionId: fortisTransactionId?.substring(0, 50),
          requestResponse: JSON.stringify(result),
          template: 'portal',
        },
      });

      // Update donor totals
      await prisma.donor.update({
        where: { id: session.customerId },
        data: {
          amountAcum: { increment: amount },
          feeAcum: { increment: fee },
          netAcum: { increment: netAmount },
        },
      });
    }

    // Create subscription if applicable
    if (product.isSubscription && savedSourceId) {
      const nextPaymentDate = new Date();
      
      if (hasTrialPeriod) {
        // First payment after trial
        nextPaymentDate.setDate(nextPaymentDate.getDate() + (product.subscriptionTrialDays || 0));
      } else {
        // Next payment based on interval
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
      }

      const subscription = await prisma.subscription.create({
        data: {
          organizationId: session.organizationId,
          donorId: session.customerId,
          sourceId: savedSourceId,
          firstName: customer.firstName || '',
          lastName: customer.lastName || '',
          email: customer.email || '',
          amount,
          frequency: mapInterval(product.subscriptionInterval),
          status: 'A',
          startOn: new Date(),
          nextPaymentOn: nextPaymentDate,
          lastPaymentOn: hasTrialPeriod ? null : new Date(),
          source: payment_method === 'ach' ? 'ACH' : 'CC',
          givingSource: 'portal',
          template: 'portal',
          successTrxns: hasTrialPeriod ? 0 : 1,
          fortisWalletId: tokenId,
        },
      });

      console.log('[Portal Checkout Ticket] Created subscription:', subscription.id);

      // Update transaction with subscription ID
      if (transaction) {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { subscriptionId: subscription.id },
        });
      }
    }

    await logPaymentEvent({
      eventType: hasTrialPeriod ? 'subscription.trial_started' : 'payment.succeeded',
      organizationId: session.organizationId,
      transactionId: transaction?.id,
      amount: hasTrialPeriod ? 0 : amount,
      metadata: {
        productId: product.id,
        productName: product.name,
        isSubscription: product.isSubscription,
        hasTrialPeriod,
        cardSaved: !!savedSourceId,
      },
    });

    return NextResponse.json({
      success: true,
      message: hasTrialPeriod
        ? `Trial started! First payment will be charged in ${product.subscriptionTrialDays} days.`
        : product.isSubscription
          ? 'Subscription started successfully!'
          : 'Purchase completed successfully!',
      transaction: transaction ? {
        id: transaction.id,
        status: 'succeeded',
      } : null,
      cardSaved: !!savedSourceId,
      purchase: {
        productName: product.name,
        amount: hasTrialPeriod ? 0 : amount,
        isSubscription: product.isSubscription,
        trialDays: hasTrialPeriod ? product.subscriptionTrialDays : 0,
      },
    });
  } catch (error) {
    console.error('[Portal Checkout Ticket] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process checkout', details: String(error) },
      { status: 500 }
    );
  }
}

function mapInterval(interval: string | null): string {
  switch (interval) {
    case 'W': return 'weekly';
    case 'M': return 'monthly';
    case 'Q': return 'quarterly';
    case 'Y': return 'yearly';
    default: return 'monthly';
  }
}

