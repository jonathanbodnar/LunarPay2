import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createFortisClient } from '@/lib/fortis/client';
import { calculateFee } from '@/lib/utils';
import { logPaymentEvent } from '@/lib/payment-logger';
import { sendPaymentConfirmation, sendMerchantPaymentNotification } from '@/lib/email';

/**
 * POST /api/customers/[id]/process-ticket
 * Process a ticket sale after Fortis Elements returns a ticket_id
 * Used for subscriptions and payments that need to save the card
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
    const {
      ticketId,
      amount, // in cents
      isSubscription = false,
      productId,
      sendReceipt = true,
    } = body;

    console.log('[Process Customer Ticket] Received:', {
      customerId,
      ticketId,
      amount,
      isSubscription,
      productId,
    });

    if (!ticketId) {
      return NextResponse.json(
        { error: 'Ticket ID is required' },
        { status: 400 }
      );
    }

    // Verify customer belongs to user
    const customer = await prisma.donor.findFirst({
      where: {
        id: customerId,
        userId: currentUser.userId,
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

    const fortisOnboarding = customer.organization.fortisOnboarding;
    if (!fortisOnboarding?.authUserId || !fortisOnboarding?.authUserApiKey) {
      return NextResponse.json(
        { error: 'Payment processing not configured' },
        { status: 400 }
      );
    }

    // Create Fortis client
    const fortisEnv = process.env.fortis_environment || 'dev';
    const env = fortisEnv === 'prd' ? 'production' : 'sandbox';
    const fortisClient = createFortisClient(
      env as 'sandbox' | 'production',
      fortisOnboarding.authUserId,
      fortisOnboarding.authUserApiKey
    );

    // Process ticket sale with save_account: true to get the token_id
    const result = await fortisClient.processTicketSale({
      ticket_id: ticketId,
      transaction_amount: amount,
      save_account: true,
      location_id: fortisOnboarding.locationId || undefined,
      transaction_c1: `DASH-${customerId}-${Date.now()}`,
    });

    console.log('[Process Customer Ticket] Fortis result:', {
      status: result.status,
      tokenId: result.tokenId,
      transactionId: result.transaction?.id,
      message: result.message,
    });

    if (!result.status) {
      await logPaymentEvent({
        eventType: 'payment.failed',
        organizationId: customer.organizationId,
        metadata: {
          customerId,
          ticketId,
          error: result.message,
        },
      });

      return NextResponse.json({
        success: false,
        error: result.message || 'Payment was declined',
        reasonCode: result.reasonCode,
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

    // Calculate amounts
    const amountInDollars = amount / 100;
    const fee = calculateFee(amountInDollars, 0.023, 0.30);
    const netAmount = amountInDollars - fee;

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId: currentUser.userId,
        organizationId: customer.organizationId,
        donorId: customer.id,
        firstName: customer.firstName || account_holder_name?.split(' ')[0] || '',
        lastName: customer.lastName || account_holder_name?.split(' ').slice(1).join(' ') || '',
        email: customer.email || '',
        totalAmount: amountInDollars,
        subTotalAmount: netAmount,
        fee,
        source: payment_method === 'ach' ? 'ACH' : 'CC',
        status: 'P',
        transactionType: isSubscription ? 'Subscription' : 'Payment',
        givingSource: 'dashboard',
        fortisTransactionId: fortisTransactionId?.substring(0, 50),
        requestResponse: JSON.stringify(result),
        template: 'dashboard',
      },
    });

    // Save payment method using the token_id
    let savedSourceId: number | null = null;
    if (tokenId) {
      const existingSource = await prisma.source.findFirst({
        where: { fortisWalletId: tokenId, donorId: customer.id },
      });

      if (!existingSource) {
        let expMonth: string | null = null;
        let expYear: string | null = null;
        if (exp_date && exp_date.length === 4) {
          expMonth = exp_date.substring(0, 2);
          expYear = '20' + exp_date.substring(2, 4);
        }

        const newSource = await prisma.source.create({
          data: {
            donorId: customer.id,
            organizationId: customer.organizationId,
            sourceType: payment_method === 'ach' ? 'ach' : 'cc',
            bankType: account_type || null,
            lastDigits: last_four || '',
            nameHolder: account_holder_name || '',
            expMonth,
            expYear,
            isDefault: true,
            isActive: true,
            isSaved: true,
            fortisWalletId: tokenId,
            fortisCustomerId: customer.id.toString(),
          },
        });
        savedSourceId = newSource.id;
        console.log('[Process Customer Ticket] Saved card:', { sourceId: newSource.id, tokenId });

        // Unset other defaults
        await prisma.source.updateMany({
          where: { donorId: customer.id, id: { not: newSource.id } },
          data: { isDefault: false },
        });
      } else {
        savedSourceId = existingSource.id;
      }
    }

    // Create subscription if this is for a subscription product
    if (isSubscription && productId && savedSourceId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (product?.isSubscription) {
        // Calculate next billing date
        const nextBillingDate = new Date();
        const interval = product.subscriptionInterval?.toLowerCase() || 'monthly';
        const intervalCount = product.subscriptionIntervalCount || 1;

        if (interval === 'daily' || interval === 'd') {
          nextBillingDate.setDate(nextBillingDate.getDate() + intervalCount);
        } else if (interval === 'weekly' || interval === 'w') {
          nextBillingDate.setDate(nextBillingDate.getDate() + (7 * intervalCount));
        } else if (interval === 'monthly' || interval === 'm') {
          nextBillingDate.setMonth(nextBillingDate.getMonth() + intervalCount);
        } else if (interval === 'yearly' || interval === 'y') {
          nextBillingDate.setFullYear(nextBillingDate.getFullYear() + intervalCount);
        }

        const subscription = await prisma.subscription.create({
          data: {
            organizationId: customer.organizationId,
            donorId: customer.id,
            sourceId: savedSourceId,
            amount: amountInDollars,
            frequency: interval,
            status: 'A',
            firstName: customer.firstName || '',
            lastName: customer.lastName || '',
            email: customer.email || '',
            givingSource: 'dashboard',
            source: payment_method === 'ach' ? 'BNK' : 'CC',
            startOn: new Date(),
            nextPaymentOn: nextBillingDate,
            lastPaymentOn: new Date(),
            successTrxns: 1,
            fortisWalletId: tokenId,
          },
        });

        console.log('[Process Customer Ticket] Created subscription:', {
          subscriptionId: subscription.id,
          amount: amountInDollars,
          interval,
          nextBillingDate,
        });

        // Update transaction with subscription ID
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { subscriptionId: subscription.id },
        });
      }
    }

    // Update customer totals
    await prisma.donor.update({
      where: { id: customer.id },
      data: {
        amountAcum: { increment: amountInDollars },
        feeAcum: { increment: fee },
        netAcum: { increment: netAmount },
      },
    });

    // Log payment event
    await logPaymentEvent({
      eventType: 'payment.succeeded',
      organizationId: customer.organizationId,
      transactionId: transaction.id,
      amount: amountInDollars,
      fortisTransactionId,
      metadata: {
        customerId,
        tokenId,
        isSubscription,
        productId,
      },
    });

    // Send emails
    const organization = customer.organization;
    const customerName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Customer';
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    if (sendReceipt && customer.email) {
      try {
        await sendPaymentConfirmation({
          customerName,
          customerEmail: customer.email,
          amount: `$${amountInDollars.toFixed(2)}`,
          lastFour: last_four || '****',
          paymentMethod: payment_method === 'ach' ? 'bank' : 'card',
          transactionId: transaction.id.toString(),
          date: dateStr,
          organizationName: organization.name,
          organizationEmail: organization.email || undefined,
          organizationId: organization.id,
        });
      } catch (emailError) {
        console.error('[Process Customer Ticket] Customer email error:', emailError);
      }
    }

    if (organization.email) {
      try {
        await sendMerchantPaymentNotification({
          merchantEmail: organization.email,
          customerName,
          customerEmail: customer.email || '',
          amount: `$${amountInDollars.toFixed(2)}`,
          netAmount: `$${netAmount.toFixed(2)}`,
          fee: `$${fee.toFixed(2)}`,
          paymentMethod: payment_method === 'ach' ? 'bank' : 'card',
          lastFour: last_four || '****',
          transactionId: transaction.id.toString(),
          date: dateStr,
          organizationName: organization.name,
          source: 'dashboard',
        });
      } catch (emailError) {
        console.error('[Process Customer Ticket] Merchant email error:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      transactionId: transaction.id.toString(),
      status: 'succeeded',
      message: isSubscription ? 'Subscription started successfully!' : 'Payment successful!',
      cardSaved: !!savedSourceId,
      subscriptionCreated: isSubscription,
      receipt: {
        amount: amountInDollars,
        lastFour: last_four,
        date: new Date().toISOString(),
      },
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('[Process Customer Ticket] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment', details: String(error) },
      { status: 500 }
    );
  }
}

