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
    let locationId = organization.fortisOnboarding.locationId;

    if (!merchantUserId || !merchantApiKey) {
      return NextResponse.json(
        { error: 'Merchant credentials not found' },
        { status: 400 }
      );
    }

    // Determine environment
    const fortisEnv = process.env.fortis_environment || 'dev';
    const env = fortisEnv === 'prd' ? 'production' : 'sandbox';

    // Create Fortis client with merchant credentials
    const fortisClient = createFortisClient(
      env as 'sandbox' | 'production',
      merchantUserId,
      merchantApiKey
    );

    // If location_id is not stored, try to fetch it from Fortis API
    if (!locationId) {
      console.log('[Fortis Intention] Location ID missing, fetching from API...');
      
      const locationsResult = await fortisClient.getLocations();
      
      if (locationsResult.status && locationsResult.locations && locationsResult.locations.length > 0) {
        locationId = locationsResult.locations[0].id;
        
        console.log('[Fortis Intention] Fetched location_id:', locationId);
        
        // Save it for future use
        await prisma.fortisOnboarding.update({
          where: { id: organization.fortisOnboarding.id },
          data: { 
            locationId,
            updatedAt: new Date(),
          },
        });
      } else {
        console.error('[Fortis Intention] Failed to fetch locations:', locationsResult.message);
        return NextResponse.json(
          { error: 'Could not fetch merchant location. Please contact support.' },
          { status: 400 }
        );
      }
    }

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
      locationId,
      environment: env,
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

