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
    const transaction_amount = txData.transaction_amount || txData.transactionAmount || txData.amount || 0;
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
    let donor = null;
    if (customerId) {
      donor = await prisma.donor.findUnique({ where: { id: customerId } });
    } else if (customerEmail) {
      donor = await prisma.donor.findFirst({
        where: {
          email: customerEmail,
          organizationId,
        },
      });
    }

    if (!donor && customerEmail) {
      donor = await prisma.donor.create({
        data: {
          userId: organization.userId,
          organizationId,
          firstName: customerFirstName || account_holder_name?.split(' ')[0] || 'Guest',
          lastName: customerLastName || account_holder_name?.split(' ').slice(1).join(' ') || '',
          email: customerEmail,
          amountAcum: 0,
          feeAcum: 0,
          netAcum: 0,
        },
      });
    }

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId: organization.userId,
        organizationId,
        donorId: donor?.id || 0, // Default to 0 if no donor (guest checkout)
        firstName: customerFirstName || account_holder_name?.split(' ')[0] || 'Guest',
        lastName: customerLastName || account_holder_name?.split(' ').slice(1).join(' ') || '',
        email: customerEmail || '',
        totalAmount: amountInDollars,
        subTotalAmount: netAmount,
        fee,
        source: payment_method === 'ach' ? 'ACH' : 'CC',
        status: isPending ? 'pending' : 'succeeded',
        statusAch: isPending ? 'pending' : null,
        transactionType: 'Payment',
        givingSource: type === 'invoice' ? 'invoice' : 'payment_link',
        fortisTransactionId,
        requestResponse: JSON.stringify(fortisResponse),
        template: 'lunarpayfr', // Default template
      },
    });

    // Update reference (invoice or payment link)
    if (type === 'invoice' && referenceId) {
      const invoice = await prisma.invoice.findUnique({ 
        where: { id: referenceId } 
      });
      
      if (invoice) {
        const newPaidAmount = Number(invoice.paidAmount) + amountInDollars;
        const isPaid = newPaidAmount >= Number(invoice.totalAmount);
        
        await prisma.invoice.update({
          where: { id: referenceId },
          data: {
            paidAmount: newPaidAmount,
            status: isPaid ? 'paid' : 'partial',
          },
        });

        // Invoice products are already linked via invoiceId
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

