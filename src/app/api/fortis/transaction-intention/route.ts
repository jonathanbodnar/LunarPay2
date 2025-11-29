import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createFortisClient } from '@/lib/fortis/client';

export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();

    const { organizationId, amount, action = 'sale' } = body;

    // Verify user owns this organization
    const organization = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        userId: currentUser.userId,
      },
      include: {
        fortisOnboarding: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if merchant is active
    if (organization.fortisOnboarding?.appStatus !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Merchant account not active. Complete onboarding first.' },
        { status: 400 }
      );
    }

    // Get merchant credentials
    const merchantUserId = organization.fortisOnboarding.authUserId;
    const merchantApiKey = organization.fortisOnboarding.authUserApiKey;
    const locationId = organization.fortisOnboarding.locationId;

    if (!merchantUserId || !merchantApiKey || !locationId) {
      return NextResponse.json(
        { error: 'Merchant credentials not found' },
        { status: 400 }
      );
    }

    // Create Fortis client with merchant credentials
    const fortisClient = createFortisClient(
      process.env.FORTIS_ENVIRONMENT as 'sandbox' | 'production',
      merchantUserId,
      merchantApiKey
    );

    // Create transaction intention
    const result = await fortisClient.createTransactionIntention({
      location_id: locationId,
      action,
      amount: action === 'sale' ? amount : undefined,
    });

    if (!result.status) {
      return NextResponse.json(
        { error: result.message || 'Failed to create transaction intention' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      clientToken: result.clientToken,
    });
  } catch (error) {
    console.error('Transaction intention error:', error);
    
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

