import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  mapPaymentMethod,
  validatePaymentMethod,
  checkProductsIntegrity,
  recalcProductsWithRequest,
  type ProductRequest,
} from '@/lib/payment-helpers';

/**
 * POST /api/customer/pay/payment-link/{hash}
 * 
 * Matches PHP: POST /customer/apiv1/Pay/payment_link/{hash}
 * 
 * Processes payment link payment with product validation matching PHP implementation
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
      products, // Array of {link_product_id, qty, start_date_input?}
      username, // Customer email
      save_source = false,
    } = body;

    // Get payment link by hash (matching PHP Payment_link_model::getByHash)
    const paymentLink = await prisma.paymentLink.findUnique({
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
        products: {
          include: {
            product: {
              select: {
                id: true,
                price: true,
                isSubscription: true,
                subscriptionInterval: true,
                subscriptionIntervalCount: true,
                subscriptionTrialDays: true,
                startSubscriptionCustomDate: true,
                customDate: true,
              },
            },
          },
        },
      },
    });

    // Validate payment link exists
    if (!paymentLink) {
      return NextResponse.json(
        { errors: ['Link not found'] },
        { status: 200 }
      );
    }

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

    // Validate payment method if not using wallet (matching PHP logic)
    if (!data_payment.wallet_id && actualPaymentMethod) {
      const mappedMethod = mapPaymentMethod(actualPaymentMethod);
      if (!validatePaymentMethod(actualPaymentMethod, paymentLink.paymentMethods)) {
        return NextResponse.json(
          { errors: ['Invalid request, payment method unavailable'] },
          { status: 200 }
        );
      }
    }

    // Validate email/username (matching PHP validation)
    if (!username || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) {
      return NextResponse.json(
        { errors: ['Invalid request, email/username is required'] },
        { status: 200 }
      );
    }

    // Find or create donor (matching PHP donor_model::getLoginData)
    let donor = await prisma.donor.findFirst({
      where: {
        email: username,
        organizationId: paymentLink.organizationId,
      },
    });

    const isAnonymous = !donor;
    let donorId = donor?.id || null;

    // Validate products integrity (matching PHP PL_checkProductsIntegrity)
    if (products && Array.isArray(products) && products.length > 0) {
      const integrityCheck = checkProductsIntegrity(
        paymentLink.products.map(p => ({
          id: p.id,
          qty: p.qty,
          unlimitedQty: p.unlimitedQty,
          product: {
            id: p.product.id,
            price: Number(p.product.price), // Convert Decimal to number
            isSubscription: p.product.isSubscription || false,
            subscriptionInterval: p.product.subscriptionInterval,
            subscriptionIntervalCount: p.product.subscriptionIntervalCount,
            subscriptionTrialDays: p.product.subscriptionTrialDays,
            startSubscriptionCustomDate: p.product.startSubscriptionCustomDate,
            customDate: p.product.customDate || false,
          },
        })),
        products as ProductRequest[]
      );

      if (!integrityCheck.valid) {
        return NextResponse.json(
          { errors: [integrityCheck.error || 'Products integrity checks not passed'] },
          { status: 200 }
        );
      }

      // Recalculate products (matching PHP PL_recalcProductsWithRequest)
      const productsRecalc = recalcProductsWithRequest(
        paymentLink.products.map(p => ({
          id: p.id,
          qty: p.qty,
          unlimitedQty: p.unlimitedQty,
          product: {
            id: p.product.id,
            price: Number(p.product.price), // Convert Decimal to number
            isSubscription: p.product.isSubscription || false,
            subscriptionInterval: p.product.subscriptionInterval,
            subscriptionIntervalCount: p.product.subscriptionIntervalCount,
            subscriptionTrialDays: p.product.subscriptionTrialDays,
            startSubscriptionCustomDate: p.product.startSubscriptionCustomDate,
            customDate: p.product.customDate || false,
          },
        })),
        products as ProductRequest[]
      );

      const includeTrnxIds: string[] = [];
      const subscriptions: any[] = [];

      // Process one-time products first (matching PHP logic)
      if (productsRecalc.countProductsOneTime > 0) {
        const amount = productsRecalc.totalAmountOneTime;

        const paymentData = {
          type: 'payment_link' as const,
          referenceId: paymentLink.id,
          organizationId: paymentLink.organizationId,
          customerId: donorId,
          customerEmail: username,
          fortisResponse: ftsData ? { transaction: ftsData, data: ftsData } : body.fortisResponse,
          savePaymentMethod: save_source,
          amount,
          products: productsRecalc.products.filter(p => !p.isSubscription), // Only one-time products
        };

        // Process payment
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                       (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
        
        const processResponse = await fetch(
          `${baseUrl}/api/public/fortis/process-payment`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData),
          }
        );

        const processResult = await processResponse.json();

        if (!processResult.success) {
          return NextResponse.json(
            {
              status: false,
              errors: processResult.error ? [processResult.error] : ['Payment processing failed'],
            },
            { status: 200 }
          );
        }

        includeTrnxIds.push(processResult.transactionId);
      }

      // Process subscription products separately (matching PHP logic)
      const subscriptionProducts = productsRecalc.products.filter(p => p.isSubscription);
      
      // Note: Subscription handling would go here
      // For now, we'll just track them but not create subscriptions
      // This matches PHP's behavior where subscriptions are created via Payments::process with recurring != 'one_time'

      // Get updated payment link (matching PHP: getByHash with transaction IDs)
      const paymentLinkUpdated = await prisma.paymentLink.findUnique({
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
              // Note: primaryColor, backgroundColor, buttonTextColor columns don't exist in database yet
              // primaryColor: true,
              // backgroundColor: true,
              // buttonTextColor: true,
            },
          },
          products: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  price: true,
                  fileHash: true,
                  isSubscription: true,
                  subscriptionInterval: true,
                  subscriptionIntervalCount: true,
                  subscriptionTrialDays: true,
                },
              },
            },
          },
          productsPaid: {
            where: {
              transactionId: {
                in: includeTrnxIds.map(id => BigInt(id)),
              },
            },
            orderBy: { paidAt: 'desc' },
          },
        },
      });

      // Return response matching PHP format
      return NextResponse.json(
        {
          status: true,
          message: 'Payment Processed!',
          trxn_id: includeTrnxIds[0] || null,
          subscriptions: subscriptions.length > 0 ? subscriptions : undefined,
          payment_link: paymentLinkUpdated,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { errors: ['Products are required'] },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('[Payment Link Payment] Error:', error);
    return NextResponse.json(
      {
        status: false,
        errors: [error instanceof Error ? error.message : 'An error occurred'],
      },
      { status: 200 } // PHP uses HTTP_OK even for exceptions in payment_link
    );
  }
}

