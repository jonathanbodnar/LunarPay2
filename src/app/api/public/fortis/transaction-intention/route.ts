import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createFortisClient } from '@/lib/fortis/client';

/**
 * PUBLIC API - No authentication required
 * Creates a Fortis transaction intention for:
 * - Invoice payments
 * - Payment link payments
 * - Customer portal purchases
 * 
 * Returns a client_token for Fortis Elements iframe
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      organizationId, 
      amount, 
      action = 'sale',
      type = 'invoice', // 'invoice', 'payment_link', 'portal'
      referenceId, // invoiceId, paymentLinkId, etc.
      savePaymentMethod = false,
    } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Get organization with Fortis credentials
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
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
        { error: 'This merchant is not set up to receive payments yet' },
        { status: 400 }
      );
    }

    // Get merchant credentials
    const merchantUserId = organization.fortisOnboarding.authUserId;
    const merchantApiKey = organization.fortisOnboarding.authUserApiKey;
    let locationId = organization.fortisOnboarding.locationId;

    if (!merchantUserId || !merchantApiKey) {
      return NextResponse.json(
        { error: 'Merchant payment credentials not found' },
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
      console.log('[PUBLIC Fortis Intention] Location ID missing, fetching from API...');
      
      const locationsResult = await fortisClient.getLocations();
      
      if (locationsResult.status && locationsResult.locations && locationsResult.locations.length > 0) {
        locationId = locationsResult.locations[0].id;
        
        console.log('[PUBLIC Fortis Intention] Fetched location_id:', locationId);
        
        // Save it for future use
        await prisma.fortisOnboarding.update({
          where: { id: organization.fortisOnboarding.id },
          data: { 
            locationId,
            updatedAt: new Date(),
          },
        });
      } else {
        console.error('[PUBLIC Fortis Intention] Failed to fetch locations:', locationsResult.message);
        return NextResponse.json(
          { error: 'Merchant payment location not configured. Please contact the merchant.' },
          { status: 400 }
        );
      }
    }

    if (!locationId) {
      return NextResponse.json(
        { error: 'Payment location not configured. Please contact support.' },
        { status: 400 }
      );
    }

    // Determine the action for Fortis
    // If saving payment method without charging, use 'store'
    // Otherwise use 'sale' for direct payment
    const fortisAction = savePaymentMethod && !amount ? 'store' : (action || 'sale');

    // Build transaction intention data
    const intentionData: Record<string, any> = {
      location_id: locationId,
      action: fortisAction,
    };

    // Add amount for sale action (in cents)
    if (fortisAction === 'sale' && amount) {
      intentionData.amount = Math.round(amount * 100); // Convert dollars to cents
    }

    // Add transaction reference for tracking
    if (referenceId) {
      intentionData.transaction_c1 = `${type.toUpperCase()}-${referenceId}`;
    }

    console.log('[PUBLIC Fortis Intention] Creating intention:', {
      organizationId,
      action: fortisAction,
      amount: intentionData.amount,
      locationId,
      type,
      referenceId,
      environment: env,
    });

    // Create transaction intention
    const result = await fortisClient.createTransactionIntention(intentionData);

    if (!result.status || !result.clientToken) {
      console.error('[PUBLIC Fortis Intention] Failed:', result.message);
      return NextResponse.json(
        { error: result.message || 'Failed to initialize payment form' },
        { status: 400 }
      );
    }

    console.log('[PUBLIC Fortis Intention] Success - Token generated');

    return NextResponse.json({
      success: true,
      clientToken: result.clientToken,
      locationId,
      environment: env,
    });
  } catch (error) {
    console.error('[PUBLIC Fortis Intention] Error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize payment' },
      { status: 500 }
    );
  }
}

