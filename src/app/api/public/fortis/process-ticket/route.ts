import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createFortisClient } from '@/lib/fortis/client';
import { calculateFee, formatCurrency, formatDate } from '@/lib/utils';
import { logPaymentEvent } from '@/lib/payment-logger';
import { sendPaymentConfirmation, sendMerchantPaymentNotification } from '@/lib/email';

/**
 * PUBLIC API - No authentication required
 * Processes a ticket sale after Fortis Elements returns a ticket_id
 * 
 * This is used for recurring/subscription payments where we need:
 * 1. Process the payment
 * 2. Save the card (get token_id) for future charges
 * 3. Create subscription record
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      type, // 'invoice', 'payment_link', 'portal'
      referenceId, // invoiceId, paymentLinkId, or productId
      organizationId,
      ticketId, // The ticket_id from Fortis Elements
      amount, // Amount in cents
      customerEmail,
      customerFirstName,
      customerLastName,
      products, // For subscriptions
    } = body;

    console.log('[Process Ticket] Received:', {
      type,
      referenceId,
      organizationId,
      ticketId,
      amount,
      customerEmail,
      hasProducts: !!products,
    });

    if (!ticketId) {
      return NextResponse.json(
        { error: 'Ticket ID is required' },
        { status: 400 }
      );
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Get organization with Fortis credentials
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
        fortisOnboarding: {
          select: {
            authUserId: true,
            authUserApiKey: true,
            locationId: true,
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const fortisOnboarding = organization.fortisOnboarding;
    if (!fortisOnboarding?.authUserId || !fortisOnboarding?.authUserApiKey) {
      return NextResponse.json(
        { error: 'Merchant payment credentials not found' },
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
      save_account: true, // This returns token_id for future charges
      location_id: fortisOnboarding.locationId || undefined,
      transaction_c1: `LP-${type}-${referenceId}`,
    });

    console.log('[Process Ticket] Fortis result:', {
      status: result.status,
      tokenId: result.tokenId,
      transactionId: result.transaction?.id,
      message: result.message,
    });

    if (!result.status) {
      await logPaymentEvent({
        eventType: 'payment.failed',
        organizationId,
        metadata: {
          type,
          referenceId,
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
    const tokenId = result.tokenId; // Saved card token for future charges
    const fortisTransactionId = txData.id;
    
    // Extract card info
    const last_four = txData.last_four || txData.last4 || '';
    const account_holder_name = txData.account_holder_name || customerFirstName + ' ' + customerLastName || '';
    const account_type = txData.account_type || '';
    const payment_method = txData.payment_method || 'cc';
    const exp_date = txData.exp_date || '';

    // Calculate amounts
    const amountInDollars = amount / 100;
    const fee = calculateFee(amountInDollars, 0.023, 0.30);
    const netAmount = amountInDollars - fee;

    // Find or create donor - use multiple matching strategies to prevent duplicates
    let donor = null;
    
    // 1. Try to match by email first (most reliable)
    if (customerEmail) {
      donor = await prisma.donor.findFirst({
        where: {
          email: { equals: customerEmail, mode: 'insensitive' },
          organizationId,
        },
      });
      if (donor) {
        console.log('[Process Ticket] Found existing customer by email:', customerEmail, 'donorId:', donor.id);
      }
    }
    
    // 2. Try to match by existing saved token (for returning customers)
    if (!donor && tokenId) {
      const existingSource = await prisma.source.findFirst({
        where: {
          fortisWalletId: tokenId,
          organizationId,
        },
        include: { donor: true },
      });
      
      if (existingSource?.donor) {
        donor = existingSource.donor;
        console.log('[Process Ticket] Found existing customer by tokenId:', tokenId, 'donorId:', donor.id);
      }
    }
    
    // 3. Try to match by name + card last 4 (for customers without email)
    if (!donor && !customerEmail && last_four && (customerFirstName || account_holder_name)) {
      const nameToMatch = customerFirstName || account_holder_name?.split(' ')[0] || '';
      const lastNameToMatch = customerLastName || account_holder_name?.split(' ').slice(1).join(' ') || '';
      
      const matchingSource = await prisma.source.findFirst({
        where: {
          organizationId,
          lastDigits: last_four,
          donor: {
            firstName: { equals: nameToMatch, mode: 'insensitive' },
            ...(lastNameToMatch ? { lastName: { equals: lastNameToMatch, mode: 'insensitive' } } : {}),
          },
        },
        include: { donor: true },
      });
      
      if (matchingSource?.donor) {
        donor = matchingSource.donor;
        console.log('[Process Ticket] Found existing customer by name + card last4:', nameToMatch, last_four, 'donorId:', donor.id);
      }
    }

    // 4. Create new donor only if no match found
    if (!donor && (customerEmail || customerFirstName || customerLastName || account_holder_name)) {
      donor = await prisma.donor.create({
        data: {
          userId: organization.userId,
          organizationId,
          firstName: customerFirstName || account_holder_name?.split(' ')[0] || 'Customer',
          lastName: customerLastName || account_holder_name?.split(' ').slice(1).join(' ') || '',
          email: customerEmail || null,
          amountAcum: 0,
          feeAcum: 0,
          netAcum: 0,
        },
      });
      console.log('[Process Ticket] Created new customer:', customerEmail || '(no email)', 'donorId:', donor.id);
    }

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId: organization.userId,
        organizationId,
        donorId: donor?.id ?? 0,
        firstName: customerFirstName || account_holder_name?.split(' ')[0] || 'Customer',
        lastName: customerLastName || account_holder_name?.split(' ').slice(1).join(' ') || '',
        email: customerEmail || '',
        totalAmount: amountInDollars,
        subTotalAmount: netAmount,
        fee,
        source: payment_method === 'ach' ? 'BNK' : 'CC',
        status: 'P', // Paid
        transactionType: 'DO',
        givingSource: type === 'invoice' ? 'invoice' : 'payment_link',
        invoiceId: type === 'invoice' ? referenceId : null,
        paymentLinkId: type === 'payment_link' ? referenceId : null,
        fortisTransactionId: fortisTransactionId?.substring(0, 50),
        requestResponse: JSON.stringify(result),
        template: 'lunarpayfr',
      },
    });

    // Save payment method using the token_id
    let savedSourceId: number | null = null;
    if (tokenId && donor) {
      // Check if already exists
      const existingSource = await prisma.source.findFirst({
        where: { fortisWalletId: tokenId, donorId: donor.id },
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
            donorId: donor.id,
            organizationId,
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
            fortisCustomerId: donor.id.toString(),
          },
        });
        savedSourceId = newSource.id;
        console.log('[Process Ticket] Saved card:', { sourceId: newSource.id, tokenId });

        // Unset other defaults
        await prisma.source.updateMany({
          where: { donorId: donor.id, id: { not: newSource.id } },
          data: { isDefault: false },
        });
      } else {
        savedSourceId = existingSource.id;
      }
    }

    // Handle subscriptions
    if (products && donor && savedSourceId) {
      for (const product of products as Array<{
        productId: number;
        productPrice: number;
        qtyReq: number;
        isSubscription?: boolean;
        subscriptionInterval?: string;
        subscriptionIntervalCount?: number;
      }>) {
        if (product.isSubscription) {
          // Calculate next billing date
          const nextBillingDate = new Date();
          const interval = product.subscriptionInterval?.toLowerCase() || 'monthly';
          const intervalCount = product.subscriptionIntervalCount || 1;
          
          if (interval === 'daily') {
            nextBillingDate.setDate(nextBillingDate.getDate() + intervalCount);
          } else if (interval === 'weekly') {
            nextBillingDate.setDate(nextBillingDate.getDate() + (7 * intervalCount));
          } else if (interval === 'monthly') {
            nextBillingDate.setMonth(nextBillingDate.getMonth() + intervalCount);
          } else if (interval === 'yearly') {
            nextBillingDate.setFullYear(nextBillingDate.getFullYear() + intervalCount);
          }

          await prisma.subscription.create({
            data: {
              organizationId,
              donorId: donor.id,
              sourceId: savedSourceId,
              amount: product.productPrice,
              frequency: interval.charAt(0).toUpperCase(),
              status: 'A',
              firstName: customerFirstName || '',
              lastName: customerLastName || '',
              email: customerEmail || '',
              givingSource: 'payment_link',
              source: payment_method === 'ach' ? 'BNK' : 'CC',
              startOn: new Date(),
              nextPaymentOn: nextBillingDate,
            },
          });

          console.log('[Process Ticket] Created subscription:', {
            productId: product.productId,
            amount: product.productPrice,
            interval,
            nextBillingDate,
          });
        }

        // Create PaymentLinkProductPaid record
        if (type === 'payment_link' && referenceId) {
          const paymentLinkProduct = await prisma.paymentLinkProduct.findFirst({
            where: { paymentLinkId: referenceId, productId: product.productId },
          });

          if (paymentLinkProduct) {
            const productRecord = await prisma.product.findUnique({
              where: { id: product.productId },
              select: { name: true },
            });

            await prisma.paymentLinkProductPaid.create({
              data: {
                paymentLinkProductId: paymentLinkProduct.id,
                paymentLinkId: referenceId,
                productId: product.productId,
                productName: productRecord?.name || 'Product',
                productPrice: product.productPrice,
                qtyReq: product.qtyReq,
                transactionId: transaction.id,
              },
            });
          }
        }
      }
    }

    // Update donor totals
    if (donor) {
      try {
        const currentDonor = await prisma.donor.findUnique({
          where: { id: donor.id },
          select: { amountAcum: true, feeAcum: true, netAcum: true, firstDate: true },
        });
        
        await prisma.donor.update({
          where: { id: donor.id },
          data: {
            amountAcum: Number(currentDonor?.amountAcum || 0) + amountInDollars,
            feeAcum: Number(currentDonor?.feeAcum || 0) + fee,
            netAcum: Number(currentDonor?.netAcum || 0) + netAmount,
            firstDate: currentDonor?.firstDate || new Date(),
          },
        });
      } catch (err) {
        console.error('[Process Ticket] Failed to update donor totals:', err);
      }
    }

    // Update invoice if applicable
    if (type === 'invoice' && referenceId) {
      const invoice = await prisma.invoice.findUnique({ where: { id: referenceId } });
      if (invoice && invoice.status !== 'paid') {
        const newPaidAmount = Number(invoice.paidAmount) + amountInDollars;
        const isPaid = newPaidAmount >= Number(invoice.totalAmount);
        
        await prisma.invoice.update({
          where: { id: referenceId },
          data: {
            paidAmount: newPaidAmount,
            status: isPaid ? 'paid' : 'partial',
          },
        });
      }
    }

    // Log payment event
    await logPaymentEvent({
      eventType: 'payment.succeeded',
      organizationId,
      transactionId: transaction.id,
      amount: amountInDollars,
      fortisTransactionId,
      metadata: {
        type,
        referenceId,
        tokenId,
        hasSubscription: products?.some((p: any) => p.isSubscription),
      },
    });

    // Send emails
    if (customerEmail) {
      try {
        await sendPaymentConfirmation({
          customerName: `${customerFirstName || ''} ${customerLastName || ''}`.trim() || 'Customer',
          customerEmail,
          amount: formatCurrency(amountInDollars),
          lastFour: last_four || '****',
          paymentMethod: payment_method === 'ach' ? 'bank' : 'card',
          transactionId: fortisTransactionId || transaction.id.toString(),
          date: formatDate(new Date().toISOString()),
          organizationName: organization.name,
          organizationEmail: organization.email || undefined,
          organizationId: organization.id,
        });

        if (organization.email) {
          await sendMerchantPaymentNotification({
            merchantEmail: organization.email,
            customerName: `${customerFirstName || ''} ${customerLastName || ''}`.trim() || 'Customer',
            customerEmail,
            amount: formatCurrency(amountInDollars),
            netAmount: formatCurrency(netAmount),
            fee: formatCurrency(fee),
            paymentMethod: payment_method === 'ach' ? 'bank' : 'card',
            lastFour: last_four || '****',
            transactionId: fortisTransactionId || transaction.id.toString(),
            date: formatDate(new Date().toISOString()),
            organizationName: organization.name,
            source: type,
          });
        }
      } catch (emailError) {
        console.error('[Process Ticket] Email error:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      transactionId: transaction.id.toString(),
      status: 'succeeded',
      message: 'Payment successful!',
      cardSaved: !!savedSourceId,
      subscriptionCreated: products?.some((p: any) => p.isSubscription),
      receipt: {
        amount: amountInDollars,
        lastFour: last_four,
        date: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Process Ticket] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment', details: String(error) },
      { status: 500 }
    );
  }
}

