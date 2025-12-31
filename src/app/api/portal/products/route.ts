import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPortalSession } from '@/lib/portal-auth';

// GET /api/portal/products - Get products available on the portal
export async function GET() {
  try {
    const session = await getPortalSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const products = await prisma.product.findMany({
      where: {
        organizationId: session.organizationId,
        showOnPortal: true,
        trash: false,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        qty: true,
        isSubscription: true,
        subscriptionInterval: true,
        subscriptionIntervalCount: true,
        subscriptionTrialDays: true,
        fileHash: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Get portal products error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

