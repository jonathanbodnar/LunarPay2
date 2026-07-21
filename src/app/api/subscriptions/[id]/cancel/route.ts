import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { deliverWebhook } from '@/lib/webhook';

// POST /api/subscriptions/[id]/cancel - Cancel a subscription
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

    if (subscription.status === 'C' || subscription.status === 'canceled') {
      return NextResponse.json(
        { error: 'Subscription is already canceled' },
        { status: 400 }
      );
    }

    // Cancel the subscription
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'C',
        cancelledAt: new Date(),
      },
    });

    // A dashboard cancel is invisible to the merchant's own system unless we
    // send the same webhook the auto-cancel path sends.
    const org = await prisma.organization.findUnique({
      where: { id: subscription.organizationId },
      select: { webhookUrl: true, webhookSecret: true },
    });
    await deliverWebhook(
      org?.webhookUrl,
      org?.webhookSecret,
      'subscription.cancelled',
      subscription.organizationId,
      {
        subscription_id: subscription.id,
        customer_id: subscription.donorId,
        customer_email: subscription.email,
        reason: 'Cancelled from LunarPay dashboard',
      },
    );

    return NextResponse.json({
      success: true,
      message: 'Subscription canceled successfully',
      subscription: updatedSubscription,
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}

