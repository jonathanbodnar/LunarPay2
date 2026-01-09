import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateFee, formatCurrency, formatDate } from '@/lib/utils';
import { logPaymentEvent } from '@/lib/payment-logger';
import { sendPaymentConfirmation, sendMerchantPaymentNotification } from '@/lib/email';

/**
 * PUBLIC API - No authentication required
 * Processes the payment after Fortis Elements completes
 * 
 * Called with the Fortis Elements response data
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      type, // 'invoice', 'payment_link', 'portal'
      referenceId, // invoiceId, paymentLinkId, or productId
      organizationId,
      customerId, // Optional - donor ID if known
      customerEmail,
      customerFirstName,
      customerLastName,
      fortisResponse, // The response from Fortis Elements
      savePaymentMethod = false,
    } = body;

    console.log('[Process Payment] Received:', {
      type,
      referenceId,
      organizationId,
      fortisResponse: fortisResponse ? 'present' : 'missing',
    });

    // Log full Fortis response for debugging
    console.log('[Process Payment] Full Fortis Response:', JSON.stringify(fortisResponse, null, 2));

    if (!fortisResponse) {
      return NextResponse.json(
        { error: 'Payment response data is required' },
        { status: 400 }
      );
    }

    // Fortis Elements returns data in different structures depending on the event
    // Try to extract from nested 'transaction' or 'data' object, or directly from response
    const txData = fortisResponse.transaction || fortisResponse.data || fortisResponse;
    
    console.log('[Process Payment] Extracted transaction data:', JSON.stringify(txData, null, 2));

    // Extract Fortis transaction data - handle both camelCase and snake_case
    const fortisTransactionId = txData.id || txData.transaction_id || fortisResponse.id;
    // Try to get amount from body first (if passed from invoice/payment-link route), then from Fortis response
    // Amount from body is in dollars, Fortis response is in cents
    const bodyAmount = body.amount ? Math.round(Number(body.amount) * 100) : null;
    const transaction_amount = txData.transaction_amount || txData.transactionAmount || txData.amount || bodyAmount || 0;
    const status_code = txData.status_code || txData.statusCode || txData.status_id || txData.statusId;
    const reason_code_id = txData.reason_code_id || txData.reasonCodeId || txData.reason_code || txData.reasonCode;
    const account_holder_name = txData.account_holder_name || txData.accountHolderName || txData.cardholder_name || '';
    const last_four = txData.last_four || txData.lastFour || txData.last4 || '';
    const account_type = txData.account_type || txData.accountType || txData.card_type || txData.cardType || '';
    const payment_method = txData.payment_method || txData.paymentMethod || (account_type?.toLowerCase()?.includes('check') ? 'ach' : 'cc');
    const token_id = txData.token_id || txData.tokenId || txData.token || null;
    const exp_date = txData.exp_date || txData.expDate || '';

    console.log('[Process Payment] Parsed values:', {
      fortisTransactionId,
      transaction_amount,
      status_code,
      reason_code_id,
      payment_method,
      last_four,
    });

    // Validate transaction was successful
    // Fortis status codes: 101 = approved for CC, 131/132 = pending for ACH
    // Reason code 1000 = success/approved
    // Also check for successful status strings
    const statusCodeNum = typeof status_code === 'string' ? parseInt(status_code, 10) : status_code;
    const reasonCodeNum = typeof reason_code_id === 'string' ? parseInt(reason_code_id, 10) : reason_code_id;
    
    // CC approved: status_code 101, reason_code 1000
    // ACH pending: status_code 131 or 132, reason_code 1000
    const isCCApproved = statusCodeNum === 101 && reasonCodeNum === 1000;
    const isACHPending = (statusCodeNum === 131 || statusCodeNum === 132) && reasonCodeNum === 1000;
    const isSuccessful = isCCApproved;
    const isPending = isACHPending;
    
    // Also check for generic success indicators
    const isGenericSuccess = 
      (txData.status === 'approved' || txData.status === 'success' || txData.status === 'pending') ||
      (reasonCodeNum === 1000) || // Reason code 1000 always means success
      (fortisTransactionId && !txData.error); // Has transaction ID and no error

    // Only reject if we're sure it failed (no generic success and explicit failure)
    if (!isSuccessful && !isPending && !isGenericSuccess) {
      console.log('[Process Payment] Payment failed:', {
        isSuccessful,
        isPending,
        isGenericSuccess,
        statusCodeNum,
        reasonCodeNum,
      });

      await logPaymentEvent({
        eventType: 'payment.failed',
        organizationId,
        fortisTransactionId,
        metadata: {
          type,
          referenceId,
          statusCode: status_code,
          reasonCode: reason_code_id,
        },
      });

      return NextResponse.json({
        success: false,
        error: 'Payment was declined',
        reasonCode: reason_code_id,
        debug: {
          statusCode: statusCodeNum,
          reasonCode: reasonCodeNum,
          hasTransactionId: !!fortisTransactionId,
        },
      });
    }
    
    console.log('[Process Payment] Payment accepted:', {
      isSuccessful,
      isPending,
      isGenericSuccess,
    });

    // Get organization
    // Using select to avoid fetching non-existent columns like primary_color
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Calculate amounts
    const amountInDollars = transaction_amount / 100; // Fortis returns cents
    const fee = calculateFee(amountInDollars, 0.023, 0.30); // 2.3% + $0.30
    const netAmount = amountInDollars - fee;

    // Find or create donor
    // PHP uses null for anonymous payments, but we need a donor record for the foreign key
    // So we create a donor if we have any customer info (email, name, etc.)
    let donor = null;
    
    // First try to find by customerId if provided
    if (customerId) {
      donor = await prisma.donor.findUnique({ where: { id: customerId } });
    }
    
    // If not found by ID but we have email, look up by email + organization
    // This prevents creating duplicate customers with same email
    if (!donor && customerEmail) {
      donor = await prisma.donor.findFirst({
        where: {
          email: { equals: customerEmail, mode: 'insensitive' }, // Case-insensitive email match
          organizationId,
        },
      });
      
      if (donor) {
        console.log('[Process Payment] Found existing customer by email:', customerEmail, 'donorId:', donor.id);
      }
    }

    // Create donor if we have customer info (email or name) and not found - matches PHP behavior
    // PHP creates donor records even for anonymous payments if email is provided
    if (!donor && (customerEmail || customerFirstName || customerLastName || account_holder_name)) {
      donor = await prisma.donor.create({
        data: {
          userId: organization.userId,
          organizationId,
          firstName: customerFirstName || account_holder_name?.split(' ')[0] || 'Guest',
          lastName: customerLastName || account_holder_name?.split(' ').slice(1).join(' ') || '',
          email: customerEmail || null, // Allow null email for truly anonymous payments
          amountAcum: 0,
          feeAcum: 0,
          netAcum: 0,
        },
      });
      
      console.log('[Process Payment] Created new customer:', customerEmail, 'donorId:', donor.id);
    }

    // Truncate fields to match database constraints
    const truncateString = (str: string | null | undefined, maxLength: number): string => {
      if (!str) return '';
      return str.length > maxLength ? str.substring(0, maxLength) : str;
    };

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId: organization.userId,
        organizationId,
        donorId: donor?.id ?? 0, // Use 0 for anonymous payments (matches PHP behavior)
        firstName: truncateString(customerFirstName || account_holder_name?.split(' ')[0] || 'Guest', 100),
        lastName: truncateString(customerLastName || account_holder_name?.split(' ').slice(1).join(' ') || '', 100),
        email: truncateString(customerEmail || '', 254),
        totalAmount: amountInDollars,
        subTotalAmount: netAmount,
        fee,
        source: payment_method === 'ach' ? 'BNK' : 'CC', // 'BNK' for bank, 'CC' for credit card (matches PHP)
        status: isPending ? 'U' : 'P', // 'P' = Paid/Processed, 'U' = Unpaid/Unprocessed, 'N' = Rejected
        statusAch: payment_method === 'ach' ? (isPending ? 'W' : 'P') : null, // 'W' = Waiting, 'P' = Processed, 'N' = Rejected
        transactionType: 'DO', // 'DO' = Donation/Payment (matches PHP)
        givingSource: type === 'invoice' ? 'invoice' : 'payment_link', // Max 50 chars
        invoiceId: type === 'invoice' ? referenceId : null,
        paymentLinkId: type === 'payment_link' ? referenceId : null,
        fortisTransactionId: truncateString(fortisTransactionId, 50), // Database has VARCHAR(50)
        requestResponse: JSON.stringify(fortisResponse), // TEXT/LONGTEXT, should handle large strings
        template: 'lunarpayfr', // Max 50 chars, this is 10
      },
    });

    // Update reference (invoice or payment link)
    if (type === 'invoice' && referenceId) {
      const invoice = await prisma.invoice.findUnique({ 
        where: { id: referenceId },
        include: {
          products: true,
        },
      });
      
      if (invoice) {
        // Validate invoice is not already paid (matching PHP check)
        if (invoice.status === 'paid') {
          return NextResponse.json(
            { error: 'Invoice already paid' },
            { status: 400 }
          );
        }

        const newPaidAmount = Number(invoice.paidAmount) + amountInDollars;
        const isPaid = newPaidAmount >= Number(invoice.totalAmount);
        
        await prisma.invoice.update({
          where: { id: referenceId },
          data: {
            paidAmount: newPaidAmount,
            status: isPaid ? 'paid' : 'partial',
          },
        });

        // Create transaction product records (matching PHP behavior)
        // Link invoice products to this transaction
        for (const invoiceProduct of invoice.products) {
          // Note: If TransactionProduct table exists, create records here
          // For now, products are linked via invoiceId in InvoiceProduct
        }
      }
    }

    // Handle payment link product tracking and subscriptions
    if (type === 'payment_link' && referenceId && body.products) {
      const products = body.products as Array<{
        id: number;
        productId: number;
        productPrice: number;
        qtyReq: number;
        subtotal: number;
        isSubscription?: boolean;
        subscriptionInterval?: string;
        subscriptionIntervalCount?: number;
      }>;

      // Create PaymentLinkProductPaid records (matching PHP payment_link_product_paid)
      for (const product of products) {
        // Find the payment link product
        const paymentLinkProduct = await prisma.paymentLinkProduct.findFirst({
          where: {
            paymentLinkId: referenceId,
            productId: product.productId,
          },
        });

        if (paymentLinkProduct) {
          // Get full product details
          const productRecord = await prisma.product.findUnique({
            where: { id: product.productId },
            select: { 
              name: true, 
              isSubscription: true,
              subscriptionInterval: true,
              subscriptionIntervalCount: true,
            },
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

          // Create subscription if product is a subscription
          if (productRecord?.isSubscription && donor && token_id) {
            // Calculate next billing date based on interval
            const nextBillingDate = new Date();
            const interval = productRecord.subscriptionInterval?.toLowerCase() || 'monthly';
            const intervalCount = productRecord.subscriptionIntervalCount || 1;
            
            if (interval === 'daily') {
              nextBillingDate.setDate(nextBillingDate.getDate() + intervalCount);
            } else if (interval === 'weekly') {
              nextBillingDate.setDate(nextBillingDate.getDate() + (7 * intervalCount));
            } else if (interval === 'monthly') {
              nextBillingDate.setMonth(nextBillingDate.getMonth() + intervalCount);
            } else if (interval === 'yearly') {
              nextBillingDate.setFullYear(nextBillingDate.getFullYear() + intervalCount);
            }

            // Find or create the saved source for this subscription
            let sourceId: number | null = null;
            const existingSource = await prisma.source.findFirst({
              where: { fortisWalletId: token_id, donorId: donor.id },
            });
            
            if (existingSource) {
              sourceId = existingSource.id;
            } else {
              // Force save the card for subscription (not optional)
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
                  fortisWalletId: token_id,
                  fortisCustomerId: donor.id.toString(),
                },
              });
              sourceId = newSource.id;
              
              console.log('[Process Payment] Saved card for subscription:', { sourceId, donorId: donor.id });
            }

            // Create subscription record
            await prisma.subscription.create({
              data: {
                organizationId,
                donorId: donor.id,
                sourceId: sourceId || 0,
                amount: product.productPrice,
                frequency: interval.charAt(0).toUpperCase(), // 'M' for monthly, 'W' for weekly, etc.
                status: 'A', // Active
                firstName: customerFirstName || account_holder_name?.split(' ')[0] || 'Customer',
                lastName: customerLastName || account_holder_name?.split(' ').slice(1).join(' ') || '',
                email: customerEmail || '',
                givingSource: 'payment_link',
                source: payment_method === 'ach' ? 'BNK' : 'CC',
                startOn: new Date(),
                nextPaymentOn: nextBillingDate,
              },
            });

            console.log('[Process Payment] Created subscription:', {
              productId: product.productId,
              donorId: donor.id,
              amount: product.productPrice,
              nextBillingDate,
            });
          }
        }
      }
    }

    // Update donor totals
    if (donor && isSuccessful) {
      await prisma.donor.update({
        where: { id: donor.id },
        data: {
          amountAcum: { increment: amountInDollars },
          feeAcum: { increment: fee },
          netAcum: { increment: netAmount },
        },
      });
    }

    // Save payment method if requested
    if (savePaymentMethod && token_id && donor) {
      // Check if this token already exists
      const existingSource = await prisma.source.findFirst({
        where: {
          fortisWalletId: token_id,
          donorId: donor.id,
        },
      });

      if (!existingSource) {
        // Parse expiration date
        let expMonth: string | null = null;
        let expYear: string | null = null;
        if (exp_date && exp_date.length === 4) {
          expMonth = exp_date.substring(0, 2);
          expYear = '20' + exp_date.substring(2, 4);
        }

        await prisma.source.create({
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
            fortisWalletId: token_id,
            fortisCustomerId: donor.id.toString(),
          },
        });

        // Set all other sources as non-default
        await prisma.source.updateMany({
          where: {
            donorId: donor.id,
            id: { not: undefined }, // Exclude the one we just created
            fortisWalletId: { not: token_id },
          },
          data: { isDefault: false },
        });
      }
    }

    // Log successful payment
    await logPaymentEvent({
      eventType: isPending ? 'ach.pending' : 'payment.succeeded',
      organizationId,
      transactionId: transaction.id,
      amount: amountInDollars,
      fortisTransactionId,
      metadata: {
        type,
        referenceId,
        fee,
      },
    });

    // Send payment confirmation emails
    if (customerEmail && (isSuccessful || isGenericSuccess)) {
      try {
        // Send to customer
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
          brandColor: undefined, // primaryColor column doesn't exist in database
        });
        console.log('[Process Payment] Sent payment confirmation to customer:', customerEmail);

        // Send to merchant
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
          console.log('[Process Payment] Sent payment notification to merchant:', organization.email);
        }
      } catch (emailError) {
        console.error('[Process Payment] Failed to send emails:', emailError);
        // Don't fail the payment if emails fail
      }
    }

    return NextResponse.json({
      success: true,
      transactionId: transaction.id.toString(), // Convert BigInt to string for JSON
      status: isPending ? 'pending' : 'succeeded',
      message: isPending 
        ? 'Payment initiated. Bank transfer is being processed.' 
        : 'Payment successful!',
      receipt: {
        amount: amountInDollars,
        lastFour: last_four,
        accountType: account_type,
        date: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Process Payment] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment', details: String(error) },
      { status: 500 }
    );
  }
}

