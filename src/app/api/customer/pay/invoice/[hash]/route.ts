import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mapPaymentMethod, validatePaymentMethod, INVOICE_STATUS } from '@/lib/payment-helpers';

/**
 * POST /api/customer/pay/invoice/{hash}
 * 
 * Matches PHP: POST /customer/apiv1/Pay/invoice/{hash}
 * 
 * Processes invoice payment with validation matching PHP implementation
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ hash: string }> }
) {
  try {
    const { hash } = await params;
    const body = await request.json();

    // Extract request data (matching PHP input structure)
    const {
      payment_processor = 'FTS', // Fortis
      payment_method, // 'credit_card' or 'bank_account'
      fts_event, // Fortis event data
      data_payment = {},
      save_source = false,
    } = body;

    // Get invoice by hash (matching PHP Invoice_model::getByHash)
    const invoice = await prisma.invoice.findUnique({
      where: { hash },
      include: {
        organization: {
          select: {
            id: true,
            userId: true,
            name: true,
            email: true,
          },
        },
        donor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                isSubscription: true,
                subscriptionInterval: true,
                subscriptionIntervalCount: true,
                subscriptionTrialDays: true,
              },
            },
          },
        },
      },
    });

    // Validate invoice exists
    if (!invoice) {
      return NextResponse.json(
        { errors: ['Invoice not found'] },
        { status: 200 } // PHP returns HTTP_OK (200) even for errors
      );
    }

    // Validate invoice is not already paid (matching PHP check)
    if (invoice.status === INVOICE_STATUS.PAID) {
      return NextResponse.json(
        { errors: ['Invoice already paid'] },
        { status: 200 }
      );
    }

    console.log('[Invoice Payment] Invoice details:', {
      id: invoice.id,
      hash: invoice.hash,
      status: invoice.status,
      paymentOptions: invoice.paymentOptions,
      paymentOptionsType: typeof invoice.paymentOptions,
    });

    // Handle Fortis payment processor (matching PHP logic)
    let ftsData = null;
    let actualPaymentMethod = payment_method;

    if (payment_processor === 'FTS' && fts_event?.data) {
      ftsData = fts_event.data;
      
      // Map Fortis payment method to internal format
      if (ftsData.payment_method === 'cc') {
        actualPaymentMethod = 'credit_card';
      } else if (ftsData.payment_method === 'ach') {
        actualPaymentMethod = 'bank_account';
      }
    }

    // Validate payment method against invoice options (matching PHP validation)
    if (actualPaymentMethod) {
      const mappedMethod = mapPaymentMethod(actualPaymentMethod);
      
      console.log('[Invoice Payment] Payment method validation:', {
        actualPaymentMethod,
        mappedMethod,
        paymentOptions: invoice.paymentOptions,
        paymentOptionsType: typeof invoice.paymentOptions,
      });
      
      if (!validatePaymentMethod(actualPaymentMethod, invoice.paymentOptions)) {
        console.log('[Invoice Payment] Payment method validation failed:', {
          actualPaymentMethod,
          mappedMethod,
          paymentOptions: invoice.paymentOptions,
        });
        return NextResponse.json(
          { errors: ['Invalid request, payment method unavailable'] },
          { status: 200 }
        );
      }
    }

    // Calculate amount (matching PHP: total_amount + fee)
    const totalAmount = Number(invoice.totalAmount);
    const fee = Number(invoice.fee || 0);
    const amount = totalAmount + fee;

    // Prepare payment data for processing
    const paymentData = {
      type: 'invoice' as const,
      referenceId: invoice.id,
      organizationId: invoice.organizationId,
      customerId: invoice.donorId,
      customerEmail: invoice.donor.email || '',
      customerFirstName: invoice.donor.firstName || '',
      customerLastName: invoice.donor.lastName || '',
      fortisResponse: ftsData ? { transaction: ftsData, data: ftsData } : body.fortisResponse,
      savePaymentMethod: save_source,
      amount, // Pass calculated amount
    };

    // Call the process-payment endpoint internally
    // Use absolute URL for internal API calls
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    
    console.log('[Invoice Payment] Calling process-payment with:', {
      type: paymentData.type,
      referenceId: paymentData.referenceId,
      organizationId: paymentData.organizationId,
      amount: paymentData.amount,
      hasFortisResponse: !!paymentData.fortisResponse,
    });

    let processResponse;
    let processResult;
    
    try {
      processResponse = await fetch(
        `${baseUrl}/api/public/fortis/process-payment`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paymentData),
        }
      );

      processResult = await processResponse.json();
      
      console.log('[Invoice Payment] Process-payment response:', {
        status: processResponse.status,
        success: processResult.success,
        transactionId: processResult.transactionId,
        error: processResult.error,
      });
    } catch (fetchError) {
      console.error('[Invoice Payment] Failed to call process-payment:', fetchError);
      return NextResponse.json(
        {
          status: false,
          errors: ['Failed to process payment: ' + (fetchError instanceof Error ? fetchError.message : 'Unknown error')],
        },
        { status: 200 }
      );
    }

    // Format response matching PHP output_json_api format
    if (!processResult.success || processResponse.status !== 200) {
      return NextResponse.json(
        {
          status: false,
          errors: processResult.error ? [processResult.error] : (processResult.errors || ['Payment processing failed']),
        },
        { status: 200 }
      );
    }

    // Get updated invoice (matching PHP: $this->invoice_model->getByHash($hash))
    const invoiceUpdated = await prisma.invoice.findUnique({
      where: { hash },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            email: true,
            logo: true,
            phoneNumber: true,
            website: true,
            streetAddress: true,
            city: true,
            state: true,
            postal: true,
            // Note: primaryColor, backgroundColor, buttonTextColor columns don't exist in database yet
            // primaryColor: true,
            // backgroundColor: true,
            // buttonTextColor: true,
          },
        },
        donor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            address: true,
          },
        },
        products: {
          orderBy: { id: 'asc' },
          include: {
            product: {
              select: {
                isSubscription: true,
                subscriptionInterval: true,
                subscriptionIntervalCount: true,
                subscriptionTrialDays: true,
              },
            },
          },
        },
        transactions: {
          orderBy: { id: 'desc' },
          take: 10,
        },
      },
    });

    // Serialize invoice data and convert BigInt to string for JSON
    const serializeInvoice = (invoice: any): any => {
      if (!invoice) return null;
      
      return {
        ...invoice,
        id: invoice.id,
        transactions: invoice.transactions?.map((tx: any) => ({
          ...tx,
          id: tx.id.toString(), // Convert BigInt to string
        })) || [],
      };
    };

    // Return response matching PHP format
    return NextResponse.json(
      {
        status: true,
        message: 'Payment Processed!',
        trxn_id: processResult.transactionId,
        invoice: serializeInvoice(invoiceUpdated),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Invoice Payment] Error:', error);
    return NextResponse.json(
      {
        status: false,
        errors: [error instanceof Error ? error.message : 'An error occurred'],
      },
      { status: 400 } // PHP uses HTTP_BAD_REQUEST for exceptions
    );
  }
}

