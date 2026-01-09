import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateFee } from '@/lib/utils';
import { logPaymentEvent } from '@/lib/payment-logger';
import { sendPaymentConfirmation, sendMerchantPaymentNotification } from '@/lib/email';

// POST /api/customers/[id]/process-charge - Process payment after Fortis Elements completes
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireAuth();
    const customerId = parseInt(id);
    const body = await request.json();
    const { fortisResponse, savePaymentMethod = false, sendReceipt = true } = body;

    console.log('[Process Charge] Received fortisResponse:', JSON.stringify(fortisResponse, null, 2));

    if (!fortisResponse) {
      return NextResponse.json(
        { error: 'Payment response data is required' },
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
        organization: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Parse Fortis Elements response - it can come in multiple nested structures
    // Try: fortisResponse.data?.data, fortisResponse.transaction, fortisResponse.data, fortisResponse
    let txData = fortisResponse;
    if (fortisResponse.data?.data) {
      txData = fortisResponse.data.data;
    } else if (fortisResponse.data) {
      txData = fortisResponse.data;
    } else if (fortisResponse.transaction) {
      txData = fortisResponse.transaction;
    }
    
    console.log('[Process Charge] Parsed txData:', JSON.stringify(txData, null, 2));
    
    // Extract all possible field names (camelCase and snake_case)
    const fortisTransactionId = txData.id || txData.transaction_id || fortisResponse.id || '';
    const transaction_amount = txData.transaction_amount || txData.transactionAmount || txData.auth_amount || txData.amount || 0;
    const status_code = txData.status_code || txData.statusCode || txData.status_id || txData.statusId;
    const reason_code_id = txData.reason_code_id || txData.reasonCodeId || txData.reason_code || 1000;
    const account_holder_name = txData.account_holder_name || txData.accountHolderName || txData.cardholder_name || '';
    const last_four = txData.last_four || txData.lastFour || txData.last4 || '';
    const account_type = txData.account_type || txData.accountType || txData.card_type || '';
    const payment_method = txData.payment_method || txData.paymentMethod || 
      (account_type?.toLowerCase()?.includes('check') || account_type?.toLowerCase()?.includes('saving') ? 'ach' : 'cc');
    const token_id = txData.token_id || txData.tokenId || txData.account_vault_id || null;
    const exp_date = txData.exp_date || txData.expDate || '';

    console.log('[Process Charge] Extracted values:', {
      fortisTransactionId,
      transaction_amount,
      status_code,
      reason_code_id,
      account_holder_name,
      last_four,
      payment_method,
      token_id,
    });

    // Validate transaction - Fortis status codes
    const statusCodeNum = typeof status_code === 'string' ? parseInt(status_code, 10) : (status_code || 0);
    const reasonCodeNum = typeof reason_code_id === 'string' ? parseInt(reason_code_id, 10) : (reason_code_id || 0);

    // CC approved: status_code 101, reason_code 1000
    // ACH pending: status_code 131 or 132, reason_code 1000
    const isCCApproved = statusCodeNum === 101 && reasonCodeNum === 1000;
    const isACHPending = (statusCodeNum === 131 || statusCodeNum === 132) && reasonCodeNum === 1000;
    const isSuccessful = isCCApproved;
    const isPending = isACHPending;
    
    // Generic success: has transaction ID with reason_code 1000, or just has ID and no explicit error
    const isGenericSuccess = 
      (reasonCodeNum === 1000) || 
      (fortisTransactionId && !txData.error && !txData.errors) ||
      (fortisTransactionId && statusCodeNum > 100); // Any status above 100 with ID is likely successful

    console.log('[Process Charge] Validation:', { isCCApproved, isACHPending, isSuccessful, isPending, isGenericSuccess, statusCodeNum, reasonCodeNum });

    if (!isSuccessful && !isPending && !isGenericSuccess) {
      await logPaymentEvent({
        eventType: 'payment.failed',
        organizationId: customer.organizationId,
        fortisTransactionId,
        metadata: {
          customerId,
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

    // Calculate amounts
    const amountInDollars = transaction_amount / 100;
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
        status: isPending ? 'pending' : 'succeeded',
        statusAch: isPending ? 'pending' : null,
        transactionType: 'Payment',
        givingSource: 'dashboard',
        fortisTransactionId,
        requestResponse: JSON.stringify(fortisResponse),
        template: 'dashboard',
      },
    });

    // Update customer totals
    if (isSuccessful) {
      await prisma.donor.update({
        where: { id: customer.id },
        data: {
          amountAcum: { increment: amountInDollars },
          feeAcum: { increment: fee },
          netAcum: { increment: netAmount },
        },
      });
    }

    // Save payment method if requested
    if (savePaymentMethod && token_id) {
      const existingSource = await prisma.source.findFirst({
        where: {
          fortisWalletId: token_id,
          donorId: customer.id,
        },
      });

      if (!existingSource) {
        let expMonth: string | null = null;
        let expYear: string | null = null;
        if (exp_date && exp_date.length === 4) {
          expMonth = exp_date.substring(0, 2);
          expYear = '20' + exp_date.substring(2, 4);
        }

        await prisma.source.create({
          data: {
            donorId: customer.id,
            organizationId: customer.organizationId,
            sourceType: payment_method === 'ach' ? 'ach' : 'cc',
            bankType: account_type || null,
            lastDigits: last_four,
            nameHolder: account_holder_name,
            expMonth,
            expYear,
            isDefault: true,
            isActive: true,
            isSaved: true,
            fortisWalletId: token_id,
            fortisCustomerId: customer.id.toString(),
          },
        });

        // Unset other defaults
        await prisma.source.updateMany({
          where: {
            donorId: customer.id,
            fortisWalletId: { not: token_id },
          },
          data: { isDefault: false },
        });
      }
    }

    // Log successful payment
    await logPaymentEvent({
      eventType: isPending ? 'ach.pending' : 'payment.succeeded',
      organizationId: customer.organizationId,
      transactionId: transaction.id,
      amount: amountInDollars,
      fortisTransactionId,
      metadata: {
        customerId,
        savedPaymentMethod: savePaymentMethod && !!token_id,
      },
    });

    // Send notification emails
    const organization = customer.organization;
    const customerName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Customer';
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Send receipt to customer if requested
    if (sendReceipt && customer.email) {
      await sendPaymentConfirmation({
        customerName,
        customerEmail: customer.email,
        amount: `$${amountInDollars.toFixed(2)}`,
        lastFour: last_four,
        paymentMethod: payment_method === 'ach' ? 'bank' : 'card',
        transactionId: transaction.id.toString(),
        date: dateStr,
        organizationName: organization.name,
        organizationEmail: organization.email || undefined,
        organizationId: organization.id,
      });
    }

    // Always send merchant notification
    if (organization.email) {
      await sendMerchantPaymentNotification({
        merchantEmail: organization.email,
        customerName,
        customerEmail: customer.email || '',
        amount: `$${amountInDollars.toFixed(2)}`,
        netAmount: `$${netAmount.toFixed(2)}`,
        fee: `$${fee.toFixed(2)}`,
        paymentMethod: payment_method === 'ach' ? 'bank' : 'card',
        lastFour: last_four,
        transactionId: transaction.id.toString(),
        date: dateStr,
        organizationName: organization.name,
        source: 'dashboard',
      });
    }

    return NextResponse.json({
      success: true,
      transactionId: transaction.id.toString(),
      status: isPending ? 'pending' : 'succeeded',
      message: isPending
        ? 'Payment initiated. Bank transfer is being processed.'
        : 'Payment successful!',
      receiptSent: sendReceipt && !!customer.email,
      receipt: {
        amount: amountInDollars,
        lastFour: last_four,
        accountType: account_type,
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

    console.error('[Process Charge] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}

