import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPortalSession } from '@/lib/portal-auth';

// POST /api/portal/checkout - Process a purchase or subscription
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
    const { productId, paymentMethodId } = body;

    if (!productId || !paymentMethodId) {
      return NextResponse.json(
        { error: 'Product and payment method are required' },
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

    // Get the payment method (verify it belongs to this customer)
    const paymentMethod = await prisma.source.findFirst({
      where: {
        id: paymentMethodId,
        donorId: session.customerId,
        organizationId: session.organizationId,
      },
    });

    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      );
    }

    // TODO: Integrate with actual payment processor (Fortis)
    // For now, we'll create the records but not actually charge
    
    console.log('[PORTAL CHECKOUT] Processing purchase:', {
      customerId: session.customerId,
      productId: product.id,
      productName: product.name,
      price: product.price,
      isSubscription: product.isSubscription,
      paymentMethodId: paymentMethod.id,
    });

    if (product.isSubscription) {
      // Create subscription record
      const nextPaymentDate = new Date();
      
      // Apply trial period if exists
      if (product.subscriptionTrialDays && product.subscriptionTrialDays > 0) {
        nextPaymentDate.setDate(nextPaymentDate.getDate() + product.subscriptionTrialDays);
      } else {
        // Set next payment based on interval
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

      // Create subscription using raw SQL
      await prisma.$executeRaw`
        INSERT INTO epicpay_customer_subscriptions (
          account_donor_id, church_id, amount, interval_type, subscription_status,
          next_payment_on, created_at
        ) VALUES (
          ${session.customerId}, ${session.organizationId}, ${product.price},
          ${product.subscriptionInterval || 'M'}, 'A',
          ${nextPaymentDate}, NOW()
        )
      `;

      return NextResponse.json({
        success: true,
        message: 'Subscription created successfully',
        subscription: {
          productName: product.name,
          amount: product.price,
          interval: product.subscriptionInterval,
          nextPaymentDate: nextPaymentDate.toISOString(),
          trialDays: product.subscriptionTrialDays || 0,
        },
      });
    } else {
      // One-time purchase - create a transaction record
      // For now, just log it - actual payment integration would go here
      
      return NextResponse.json({
        success: true,
        message: 'Purchase completed successfully',
        purchase: {
          productName: product.name,
          amount: product.price,
        },
      });
    }
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to process checkout', details: String(error) },
      { status: 500 }
    );
  }
}

