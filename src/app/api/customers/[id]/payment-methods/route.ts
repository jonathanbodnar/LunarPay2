import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createFortisClient } from '@/lib/fortis/client';

// GET /api/customers/:id/payment-methods - Get payment methods for a customer
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireAuth();
    const customerId = parseInt(id);

    // Verify customer belongs to user's organization
    const customer = await prisma.donor.findFirst({
      where: {
        id: customerId,
        organization: {
          userId: currentUser.userId,
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Fetch payment methods (sources)
    const sources = await prisma.source.findMany({
      where: {
        donorId: customerId,
        isActive: true,
      },
      select: {
        id: true,
        sourceType: true,
        bankType: true,
        lastDigits: true,
        nameHolder: true,
        isDefault: true,
        expMonth: true,
        expYear: true,
        createdAt: true,
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Map to a cleaner format
    const paymentMethods = sources.map((source) => ({
      id: source.id,
      lastFour: source.lastDigits || '****',
      cardBrand: source.sourceType === 'cc' ? 'Card' : null,
      accountType: source.sourceType === 'ach' ? (source.bankType || 'Bank') : null,
      isDefault: source.isDefault,
      type: source.sourceType === 'ach' ? 'bank' : 'card',
      nameHolder: source.nameHolder,
      expiry: source.expMonth && source.expYear ? `${source.expMonth}/${source.expYear}` : null,
    }));

    return NextResponse.json({ paymentMethods });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Get payment methods error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/customers/:id/payment-methods - Add a new payment method
// This can either:
// 1. Receive pre-tokenized data from Fortis Elements (fortisResponse)
// 2. Get a transaction intention token for adding via Fortis Elements
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireAuth();
    const customerId = parseInt(id);
    const body = await request.json();

    // Verify customer belongs to user's organization
    const customer = await prisma.donor.findFirst({
      where: {
        id: customerId,
        organization: {
          userId: currentUser.userId,
        },
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

    const { action, fortisResponse, isDefault = false } = body;

    // If action is 'get-token', return a transaction intention for storing a card
    if (action === 'get-token') {
      const fortisOnboarding = customer.organization.fortisOnboarding;
      
      console.log('[Payment Methods] get-token - Fortis onboarding:', {
        hasOnboarding: !!fortisOnboarding,
        hasAuthUserId: !!fortisOnboarding?.authUserId,
        hasAuthUserApiKey: !!fortisOnboarding?.authUserApiKey,
        locationId: fortisOnboarding?.locationId,
        appStatus: fortisOnboarding?.appStatus,
      });
      
      if (!fortisOnboarding?.authUserId || !fortisOnboarding?.authUserApiKey) {
        return NextResponse.json(
          { error: 'Merchant payment processing is not configured. Please complete payment setup.' },
          { status: 400 }
        );
      }

      // Get location ID - try stored value first, then fetch from Fortis if needed
      let locationId = fortisOnboarding.locationId;
      
      const fortisEnv = process.env.fortis_environment || 'dev';
      const env = fortisEnv === 'prd' ? 'production' : 'sandbox';
      
      // Validate developer ID is configured
      const developerIdEnv = env === 'sandbox' 
        ? (process.env.FORTIS_DEVELOPER_ID_SANDBOX || process.env.fortis_developer_id_sandbox)
        : (process.env.FORTIS_DEVELOPER_ID_PRODUCTION || process.env.fortis_developer_id_production);
      
      if (!developerIdEnv) {
        console.error('[Payment Methods] Developer ID not configured for environment:', env);
        return NextResponse.json(
          { 
            error: 'Payment processing is not fully configured. Please contact support.',
            details: `Missing developer ID for ${env} environment`
          },
          { status: 500 }
        );
      }
      
      let fortisClient;
      try {
        fortisClient = createFortisClient(
          env as 'sandbox' | 'production',
          fortisOnboarding.authUserId,
          fortisOnboarding.authUserApiKey
        );
      } catch (clientError) {
        console.error('[Payment Methods] Failed to create Fortis client:', clientError);
        return NextResponse.json(
          { 
            error: 'Payment processing configuration error. Please contact support.',
            details: (clientError as Error).message
          },
          { status: 500 }
        );
      }

      // If no location ID, try to fetch it
      if (!locationId) {
        console.log('[Payment Methods] Location ID missing, fetching from Fortis...');
        const locationsResult = await fortisClient.getLocations();
        if (locationsResult.status && locationsResult.locations && locationsResult.locations.length > 0) {
          locationId = locationsResult.locations[0].id;
          console.log('[Payment Methods] Fetched location ID:', locationId);
          
          // Save for future use
          await prisma.fortisOnboarding.update({
            where: { id: fortisOnboarding.id },
            data: { locationId },
          });
        }
      }

      if (!locationId) {
        return NextResponse.json(
          { error: 'Payment location not configured. Please contact support.' },
          { status: 400 }
        );
      }

      console.log('[Payment Methods] Creating intention with:', { locationId, action: 'tokenization', env });

      const result = await fortisClient.createTransactionIntention({
        location_id: locationId,
        action: 'tokenization', // Tokenize card/bank without charging
      });

      console.log('[Payment Methods] Fortis result:', { status: result.status, hasToken: !!result.clientToken, message: result.message });

      if (!result.status || !result.clientToken) {
        // Provide more detailed error message
        const errorMessage = result.message || 'Failed to get payment form token from Fortis';
        console.error('[Payment Methods] Failed to create transaction intention:', {
          error: errorMessage,
          locationId,
          environment: env,
          hasAuthUserId: !!fortisOnboarding.authUserId,
          hasAuthUserApiKey: !!fortisOnboarding.authUserApiKey,
        });
        
        // Check if it's an authentication error
        if (errorMessage.toLowerCase().includes('unauthorized') || errorMessage.toLowerCase().includes('invalid credentials')) {
          return NextResponse.json(
            { 
              error: 'Payment processing credentials are invalid or expired. Please contact support to update your payment configuration.',
              details: 'The Fortis API returned an authentication error. This may indicate that the merchant credentials need to be refreshed.'
            },
            { status: 401 }
          );
        }
        
        return NextResponse.json(
          { error: errorMessage },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        clientToken: result.clientToken,
        environment: env,
      });
    }

    // If we have a Fortis response, save the tokenized payment method
    if (fortisResponse) {
      console.log('[Payment Methods] Received fortisResponse:', JSON.stringify(fortisResponse, null, 2));
      
      // Parse Fortis Elements response - handle multiple nested structures
      let txData = fortisResponse;
      if (fortisResponse.data?.data) {
        txData = fortisResponse.data.data;
      } else if (fortisResponse.data) {
        txData = fortisResponse.data;
      } else if (fortisResponse.transaction) {
        txData = fortisResponse.transaction;
      }
      
      // Extract fields from parsed data (try both camelCase and snake_case)
      const token_id = txData.token_id || txData.tokenId || txData.account_vault_id || txData.id || null;
      const last_four = txData.last_four || txData.lastFour || txData.last4 || '';
      const account_holder_name = txData.account_holder_name || txData.accountHolderName || txData.cardholder_name || '';
      const account_type = txData.account_type || txData.accountType || txData.card_type || ''; // 'visa', 'mc', 'amex', 'checking', 'savings'
      const payment_method = txData.payment_method || txData.paymentMethod || 
        (account_type?.toLowerCase()?.includes('check') || account_type?.toLowerCase()?.includes('saving') ? 'ach' : 'cc');
      const exp_date = txData.exp_date || txData.expDate || '';

      console.log('[Payment Methods] Parsed:', { token_id, last_four, account_type, payment_method });

      if (!token_id) {
        return NextResponse.json(
          { error: 'Token ID is required. Payment may not have been tokenized correctly.' },
          { status: 400 }
        );
      }

      // Check if this token already exists
      const existingSource = await prisma.source.findFirst({
        where: {
          fortisWalletId: token_id,
          donorId: customerId,
        },
      });

      if (existingSource) {
        return NextResponse.json(
          { error: 'This payment method is already saved', paymentMethod: existingSource },
          { status: 409 }
        );
      }

      // Parse expiration date if present (as strings for Prisma)
      let expMonth: string | null = null;
      let expYear: string | null = null;
      if (exp_date && exp_date.length === 4) {
        expMonth = exp_date.substring(0, 2);
        expYear = '20' + exp_date.substring(2, 4);
      }

      // If setting as default, unset other defaults first
      if (isDefault) {
        await prisma.source.updateMany({
          where: { donorId: customerId },
          data: { isDefault: false },
        });
      }

      const source = await prisma.source.create({
        data: {
          donorId: customerId,
          organizationId: customer.organizationId,
          sourceType: payment_method === 'ach' ? 'ach' : 'cc',
          bankType: account_type || null,
          lastDigits: last_four || '',
          nameHolder: account_holder_name || '',
          expMonth,
          expYear,
          isDefault: isDefault,
          isActive: true,
          isSaved: true,
          fortisWalletId: token_id,
          fortisCustomerId: customerId.toString(),
        },
      });

      return NextResponse.json({
        success: true,
        paymentMethod: {
          id: source.id,
          lastFour: source.lastDigits,
          type: source.sourceType === 'ach' ? 'bank' : 'card',
          accountType: source.bankType,
          isDefault: source.isDefault,
          nameHolder: source.nameHolder,
        },
      }, { status: 201 });
    }

    return NextResponse.json(
      { error: 'Invalid request. Provide action or fortisResponse.' },
      { status: 400 }
    );
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Add payment method error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/:id/payment-methods?sourceId=X - Remove a payment method
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireAuth();
    const customerId = parseInt(id);
    
    const { searchParams } = new URL(request.url);
    const sourceId = searchParams.get('sourceId');

    if (!sourceId) {
      return NextResponse.json(
        { error: 'Source ID is required' },
        { status: 400 }
      );
    }

    // Verify customer belongs to user's organization
    const customer = await prisma.donor.findFirst({
      where: {
        id: customerId,
        organization: {
          userId: currentUser.userId,
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Verify source belongs to customer
    const source = await prisma.source.findFirst({
      where: {
        id: parseInt(sourceId),
        donorId: customerId,
      },
    });

    if (!source) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      );
    }

    // Soft delete - mark as inactive
    await prisma.source.update({
      where: { id: source.id },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: 'Payment method removed',
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Delete payment method error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/customers/:id/payment-methods - Update default payment method
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireAuth();
    const customerId = parseInt(id);
    const body = await request.json();
    
    const { sourceId, isDefault } = body;

    if (!sourceId) {
      return NextResponse.json(
        { error: 'Source ID is required' },
        { status: 400 }
      );
    }

    // Verify customer belongs to user's organization
    const customer = await prisma.donor.findFirst({
      where: {
        id: customerId,
        organization: {
          userId: currentUser.userId,
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Verify source belongs to customer
    const source = await prisma.source.findFirst({
      where: {
        id: sourceId,
        donorId: customerId,
      },
    });

    if (!source) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      );
    }

    // If setting as default, unset all others first
    if (isDefault) {
      await prisma.source.updateMany({
        where: { donorId: customerId },
        data: { isDefault: false },
      });
    }

    const updatedSource = await prisma.source.update({
      where: { id: sourceId },
      data: { isDefault: isDefault || false },
    });

    return NextResponse.json({
      success: true,
      paymentMethod: {
        id: updatedSource.id,
        isDefault: updatedSource.isDefault,
      },
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Update payment method error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
