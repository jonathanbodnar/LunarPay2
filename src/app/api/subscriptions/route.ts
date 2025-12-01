import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSubscriptionSchema = z.object({
  donorId: z.number(),
  organizationId: z.number(),
  sourceId: z.number(),
  amount: z.number().positive(),
  frequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly', 'Custom']),
  startDate: z.string(),
  fundId: z.number(),
  isFeeCovered: z.boolean().default(false),
});

// GET /api/subscriptions - List all subscriptions
export async function GET() {
  try {
    const currentUser = await requireAuth();

    const subscriptions = await prisma.subscription.findMany({
      where: {
        donor: {
          userId: currentUser.userId,
        },
      },
      include: {
        donor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ subscriptions });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Get subscriptions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/subscriptions - Create new subscription
export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();

    const validatedData = createSubscriptionSchema.parse(body);

    // Verify donor and source
    const donor = await prisma.donor.findFirst({
      where: {
        id: validatedData.donorId,
        userId: currentUser.userId,
      },
    });

    if (!donor) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const source = await prisma.source.findFirst({
      where: {
        id: validatedData.sourceId,
        donorId: validatedData.donorId,
        isActive: true,
      },
    });

    if (!source) {
      return NextResponse.json(
        { error: 'Payment source not found' },
        { status: 404 }
      );
    }

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        donorId: validatedData.donorId,
        organizationId: validatedData.organizationId,
        sourceId: validatedData.sourceId,
        amount: validatedData.amount,
        frequency: validatedData.frequency,
        status: 'A',
        firstName: donor.firstName || '',
        lastName: donor.lastName || '',
        email: donor.email || '',
        givingSource: 'dashboard',
        source: source.sourceType === 'card' ? 'CC' : 'BNK',
        isFeeCovered: validatedData.isFeeCovered,
        fortisCustomerId: source.fortisCustomerId,
        fortisWalletId: source.fortisWalletId,
        startOn: new Date(validatedData.startDate),
        nextPaymentOn: new Date(validatedData.startDate),
        successTrxns: 0,
        failTrxns: 0,
      },
    });

    // Create fund allocation
    await prisma.transactionFund.create({
      data: {
        subscriptionId: subscription.id,
        fundId: validatedData.fundId,
        amount: validatedData.amount,
        fee: 0, // Calculated at payment time
        net: validatedData.amount,
      },
    });

    return NextResponse.json(
      { subscription },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Create subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

