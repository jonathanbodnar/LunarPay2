import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addDays, addWeeks, addMonths, addYears } from 'date-fns';

// POST /api/subscriptions/[id]/reactivate - Reactivate a canceled subscription
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireAuth();
    const subscriptionId = parseInt(id);

    // Verify subscription belongs to user
    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        organization: {
          userId: currentUser.userId,
        },
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    if (subscription.status !== 'C' && subscription.status !== 'canceled' && subscription.status !== 'D') {
      return NextResponse.json(
        { error: 'Subscription is not canceled' },
        { status: 400 }
      );
    }

    // Check if payment method is still valid
    const paymentSource = await prisma.source.findUnique({
      where: { id: subscription.sourceId },
    });

    if (!paymentSource?.isActive) {
      return NextResponse.json(
        { error: 'Payment method is no longer valid. Please update the payment method first.' },
        { status: 400 }
      );
    }

    // Calculate next payment date based on frequency
    const now = new Date();
    let nextPaymentOn: Date;
    
    switch (subscription.frequency) {
      case 'daily':
        nextPaymentOn = addDays(now, 1);
        break;
      case 'weekly':
        nextPaymentOn = addWeeks(now, 1);
        break;
      case 'monthly':
        nextPaymentOn = addMonths(now, 1);
        break;
      case 'quarterly':
        nextPaymentOn = addMonths(now, 3);
        break;
      case 'yearly':
        nextPaymentOn = addYears(now, 1);
        break;
      default:
        nextPaymentOn = addMonths(now, 1);
    }

    // Reactivate the subscription
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'A',
        cancelledAt: null,
        nextPaymentOn,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription reactivated successfully',
      subscription: updatedSubscription,
      nextPaymentDate: nextPaymentOn,
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Reactivate subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to reactivate subscription' },
      { status: 500 }
    );
  }
}

