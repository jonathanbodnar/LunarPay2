import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPortalSession } from '@/lib/portal-auth';

// GET /api/portal/subscriptions - Get customer's subscriptions
export async function GET() {
  try {
    const session = await getPortalSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const subscriptions = await prisma.subscription.findMany({
      where: {
        donorId: session.customerId,
        organizationId: session.organizationId,
      },
      select: {
        id: true,
        amount: true,
        frequency: true,
        status: true,
        startOn: true,
        nextPaymentOn: true,
        lastPaymentOn: true,
        successTrxns: true,
        failTrxns: true,
        source: true,
        createdAt: true,
        cancelledAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/portal/subscriptions - Cancel a subscription
export async function PUT(request: Request) {
  try {
    const session = await getPortalSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json(
        { error: 'Subscription ID and action are required' },
        { status: 400 }
      );
    }

    // Verify the subscription belongs to this customer
    const subscription = await prisma.subscription.findFirst({
      where: {
        id: parseInt(id),
        donorId: session.customerId,
        organizationId: session.organizationId,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    if (action === 'cancel') {
      // Cancel the subscription
      await prisma.subscription.update({
        where: { id: parseInt(id) },
        data: {
          status: 'D', // D = Cancelled
          cancelledAt: new Date(),
        },
      });

      // TODO: Cancel with Fortis API if applicable

      return NextResponse.json({ success: true, message: 'Subscription cancelled' });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Update subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

