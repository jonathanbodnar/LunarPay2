import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPortalSession } from '@/lib/portal-auth';
import { createFortisClient } from '@/lib/fortis/client';

// POST /api/portal/payment-methods/add - Create transaction intention for adding a payment method
export async function POST() {
  try {
    const session = await getPortalSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get organization with Fortis credentials
    const organization = await prisma.organization.findUnique({
      where: { id: session.organizationId },
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

    const fortisOnboarding = organization.fortisOnboarding;

    if (!fortisOnboarding?.authUserId || !fortisOnboarding?.authUserApiKey) {
      return NextResponse.json(
        { error: 'Payment processing not configured for this merchant' },
        { status: 400 }
      );
    }

    // Get location ID
    let locationId = fortisOnboarding.locationId;

    // Create Fortis client
    const fortisEnv = process.env.fortis_environment || 'dev';
    const env = fortisEnv === 'prd' ? 'production' : 'sandbox';
    const fortisClient = createFortisClient(
      env as 'sandbox' | 'production',
      fortisOnboarding.authUserId,
      fortisOnboarding.authUserApiKey
    );

    // Fetch location ID if not set
    if (!locationId) {
      const locationsResult = await fortisClient.getLocations();
      if (locationsResult.status && locationsResult.locations && locationsResult.locations.length > 0) {
        locationId = locationsResult.locations[0].id;
        
        // Save for future use
        await prisma.fortisOnboarding.update({
          where: { id: fortisOnboarding.id },
          data: { locationId },
        });
      }
    }

    if (!locationId) {
      return NextResponse.json(
        { error: 'Payment location not configured' },
        { status: 400 }
      );
    }

    // Create transaction intention for tokenization (store action)
    const result = await fortisClient.createTransactionIntention({
      action: 'store', // Tokenization only, no payment
      amount: 0, // No charge for tokenization
      location_id: locationId,
      save_account: true,
    });

    if (!result.status) {
      console.error('[Portal Add Payment] Failed to create intention:', result.message);
      return NextResponse.json(
        { error: result.message || 'Failed to initialize payment form' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      clientToken: result.clientToken,
      locationId,
      environment: env,
    });
  } catch (error) {
    console.error('[Portal Add Payment] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

