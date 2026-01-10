import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createFortisClient } from '@/lib/fortis/client';
import { dollarsToCents } from '@/lib/utils';

// POST /api/customers/[id]/charge-intention - Create transaction/ticket intention for charging a customer
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireAuth();
    const customerId = parseInt(id);
    const body = await request.json();
    const { amount, savePaymentMethod = false, isSubscription = false, productId } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    // Verify customer belongs to user
    const customer = await prisma.donor.findFirst({
      where: {
        id: customerId,
        userId: currentUser.userId,
      },
      include: {
        organization: {
          include: {
            fortisOnboarding: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const fortisOnboarding = customer.organization.fortisOnboarding;

    if (!fortisOnboarding?.authUserId || !fortisOnboarding?.authUserApiKey) {
      return NextResponse.json(
        { error: 'Payment processing not configured. Complete payment setup first.' },
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

    // For subscriptions, use ticket intention (tokenize card, then charge with save_account)
    // For one-time payments, use transaction intention
    const useTicketFlow = isSubscription || savePaymentMethod;

    console.log('[Customer Charge] Creating intention:', {
      useTicketFlow,
      isSubscription,
      savePaymentMethod,
      amount,
    });

    let result;
    let intentionType: 'transaction' | 'ticket' = 'transaction';

    if (useTicketFlow) {
      // Ticket intention: tokenize card without charging, then process with save_account
      intentionType = 'ticket';
      result = await fortisClient.createTicketIntention({
        location_id: locationId,
      });
    } else {
      // Transaction intention: charge directly
      result = await fortisClient.createTransactionIntention({
        action: 'sale',
        amount: dollarsToCents(amount),
        location_id: locationId,
        save_account: false,
      });
    }

    if (!result.status) {
      console.error('[Customer Charge] Failed to create intention:', result.message);
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
      intentionType,
      amount: dollarsToCents(amount),
      isSubscription,
      productId,
      customer: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
      },
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('[Customer Charge] Error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize payment' },
      { status: 500 }
    );
  }
}

