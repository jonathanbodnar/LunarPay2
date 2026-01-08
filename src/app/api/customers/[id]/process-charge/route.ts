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
    const { fortisResponse, savePaymentMethod = false } = body;

    console.log('[Process Charge] Received:', JSON.stringify(fortisResponse, null, 2));

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

    // Parse Fortis response
    const txData = fortisResponse.transaction || fortisResponse.data || fortisResponse;
    
    const fortisTransactionId = txData.id || txData.transaction_id;
    const transaction_amount = txData.transaction_amount || txData.transactionAmount || txData.amount || 0;
    const status_code = txData.status_code || txData.statusCode || txData.status_id;
    const reason_code_id = txData.reason_code_id || txData.reasonCodeId;
    const account_holder_name = txData.account_holder_name || txData.accountHolderName || '';
    const last_four = txData.last_four || txData.lastFour || '';
    const account_type = txData.account_type || txData.accountType || '';
    const payment_method = txData.payment_method || txData.paymentMethod || 
      (account_type?.toLowerCase()?.includes('check') ? 'ach' : 'cc');
    const token_id = txData.token_id || txData.tokenId || null;
    const exp_date = txData.exp_date || txData.expDate || '';

    // Validate transaction
    const statusCodeNum = typeof status_code === 'string' ? parseInt(status_code, 10) : status_code;
    const reasonCodeNum = typeof reason_code_id === 'string' ? parseInt(reason_code_id, 10) : reason_code_id;

    const isCCApproved = statusCodeNum === 101 && reasonCodeNum === 1000;
    const isACHPending = (statusCodeNum === 131 || statusCodeNum === 132) && reasonCodeNum === 1000;
    const isSuccessful = isCCApproved;
    const isPending = isACHPending;
    const isGenericSuccess = (reasonCodeNum === 1000) || (fortisTransactionId && !txData.error);

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
    if (customer.email) {
      const organization = customer.organization;
      const customerName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Customer';
      const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

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

      if (organization.email) {
        await sendMerchantPaymentNotification({
          merchantEmail: organization.email,
          customerName,
          customerEmail: customer.email,
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
    }

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

