import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateFee } from '@/lib/utils';
import { logPaymentEvent } from '@/lib/payment-logger';

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

    if (!fortisResponse) {
      return NextResponse.json(
        { error: 'Payment response data is required' },
        { status: 400 }
      );
    }

    // Extract Fortis transaction data
    const {
      id: fortisTransactionId,
      transaction_amount,
      status_code,
      reason_code_id,
      account_holder_name,
      last_four,
      account_type, // 'visa', 'mc', 'amex', 'checking', 'savings'
      payment_method, // 'cc' or 'ach'
      token_id, // Tokenized payment method for saving
      expiring_in_months,
      exp_date,
    } = fortisResponse;

    // Validate transaction was successful
    // status_code 101 = approved, reason_code 1000 = success
    const isSuccessful = status_code === 101 && reason_code_id === 1000;
    const isPending = payment_method === 'ach' && reason_code_id === 1000; // ACH pending

    if (!isSuccessful && !isPending) {
      await logPaymentEvent({
        eventType: 'PAYMENT_FAILED',
        organizationId,
        transactionId: fortisTransactionId,
        data: {
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
      });
    }

    // Get organization
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
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
        donorId: donor?.id || null,
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

        // Create invoice-product link for tracking
        await prisma.invoiceProduct.updateMany({
          where: { invoiceId: referenceId },
          data: { transactionId: transaction.id },
        });
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
        let expMonth: number | null = null;
        let expYear: number | null = null;
        if (exp_date && exp_date.length === 4) {
          expMonth = parseInt(exp_date.substring(0, 2));
          expYear = parseInt('20' + exp_date.substring(2, 4));
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
      eventType: isPending ? 'ACH_PENDING' : 'PAYMENT_SUCCEEDED',
      organizationId,
      transactionId: transaction.id,
      data: {
        type,
        referenceId,
        amount: amountInDollars,
        fee,
        fortisTransactionId,
      },
    });

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
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

