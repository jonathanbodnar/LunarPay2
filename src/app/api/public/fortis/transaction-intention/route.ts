import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createFortisClient } from '@/lib/fortis/client';
import { TransactionIntentionData } from '@/types/fortis';

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
      hasRecurring = false, // If true, use ticket intention for card saving
    } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Get organization with Fortis credentials
    // Using select to avoid fetching non-existent columns like primary_color
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        fortisOnboarding: {
          select: {
            id: true,
            appStatus: true,
            authUserId: true,
            authUserApiKey: true,
            locationId: true,
          },
        },
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

    // Debug: Log exactly what we're sending to Fortis
    const baseUrl = env === 'production' 
      ? 'https://api.fortis.tech/v1/' 
      : 'https://api.sandbox.fortis.tech/v1/';

    // TICKET INTENTION FLOW: For recurring/subscription products
    // This allows us to collect card info, then call processTicketSale with save_account: true
    if (hasRecurring) {
      console.log('[PUBLIC Fortis Intention] Using TICKET intention for recurring:', {
        organizationId,
        locationId,
        type,
        referenceId,
        hasRecurring,
        amount,
        environment: env,
      });

      const ticketResult = await fortisClient.createTicketIntention({
        location_id: locationId,
      });

      if (!ticketResult.status || !ticketResult.clientToken) {
        console.error('[PUBLIC Fortis Intention] Ticket intention failed:', ticketResult.message);
        return NextResponse.json(
          { error: ticketResult.message || 'Failed to initialize payment form' },
          { status: 400 }
        );
      }

      console.log('[PUBLIC Fortis Intention] Ticket intention success');

      return NextResponse.json({
        success: true,
        clientToken: ticketResult.clientToken,
        locationId,
        environment: env,
        intentionType: 'ticket', // Frontend uses this to know which flow to follow
        amount: amount ? Math.round(amount * 100) : 0, // Return amount in cents for ticket processing
      });
    }

    // TRANSACTION INTENTION FLOW: For one-time payments
    // Determine the action for Fortis
    // Valid actions: sale, auth-only, avs-only, refund, tokenization, null
    // If saving payment method without charging, use 'tokenization'
    // Otherwise use 'sale' for direct payment
    const fortisAction: 'sale' | 'tokenization' | 'avsonly' | 'authonly' = 
      savePaymentMethod && !amount ? 'tokenization' : (action as 'sale' | 'avsonly' | 'authonly' || 'sale');

    // Build transaction intention data
    const intentionData: TransactionIntentionData = {
      location_id: locationId,
      action: fortisAction,
    };

    // Add amount for sale action (in cents)
    if (fortisAction === 'sale' && amount) {
      intentionData.amount = Math.round(amount * 100); // Convert dollars to cents
    }
    
    console.log('[PUBLIC Fortis Intention] Using TRANSACTION intention:', {
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

    console.log('[PUBLIC Fortis Intention] Transaction intention success');

    return NextResponse.json({
      success: true,
      clientToken: result.clientToken,
      locationId,
      environment: env,
      intentionType: 'transaction', // Frontend uses this to know which flow to follow
    });
  } catch (error) {
    console.error('[PUBLIC Fortis Intention] Error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize payment' },
      { status: 500 }
    );
  }
}

