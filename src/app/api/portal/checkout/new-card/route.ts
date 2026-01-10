import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPortalSession } from '@/lib/portal-auth';
import { createFortisClient } from '@/lib/fortis/client';

/**
 * POST /api/portal/checkout/new-card
 * Initialize ticket intention for purchasing with a new card
 */
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
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
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

    // Get organization with Fortis credentials
    const organization = await prisma.organization.findUnique({
      where: { id: session.organizationId },
      include: {
        fortisOnboarding: true,
      },
    });

    if (!organization?.fortisOnboarding?.authUserId) {
      return NextResponse.json(
        { error: 'Payment processing is not configured for this merchant' },
        { status: 400 }
      );
    }

    const fortisOnboarding = organization.fortisOnboarding;
    let locationId = fortisOnboarding.locationId;

    // Create Fortis client
    const fortisEnv = process.env.fortis_environment || 'dev';
    const env = fortisEnv === 'prd' ? 'production' : 'sandbox';
    const fortisClient = createFortisClient(
      env as 'sandbox' | 'production',
      fortisOnboarding.authUserId!,
      fortisOnboarding.authUserApiKey!
    );

    // Fetch location ID if not set
    if (!locationId) {
      const locationsResult = await fortisClient.getLocations();
      if (locationsResult.status && locationsResult.locations && locationsResult.locations.length > 0) {
        locationId = locationsResult.locations[0].id;
        
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

    // Use ticket intention for subscriptions or to save the card
    const result = await fortisClient.createTicketIntention({
      location_id: locationId,
    });

    if (!result.status) {
      console.error('[Portal Checkout New Card] Failed to create intention:', result.message);
      return NextResponse.json(
        { error: result.message || 'Failed to initialize payment form' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      clientToken: result.clientToken,
      environment: env,
      intentionType: 'ticket',
      product: {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        isSubscription: product.isSubscription,
        subscriptionInterval: product.subscriptionInterval,
      },
    });
  } catch (error) {
    console.error('[Portal Checkout New Card] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

