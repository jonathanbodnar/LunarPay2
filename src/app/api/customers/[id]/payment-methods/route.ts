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
      
      if (!fortisOnboarding?.authUserId || !fortisOnboarding?.authUserApiKey) {
        return NextResponse.json(
          { error: 'Merchant payment processing is not configured' },
          { status: 400 }
        );
      }

      const locationId = fortisOnboarding.locationId || 
        process.env.fortis_location_id_sandbox || 
        process.env.FORTIS_LOCATION_ID_SANDBOX;

      if (!locationId) {
        return NextResponse.json(
          { error: 'Payment location not configured' },
          { status: 400 }
        );
      }

      const fortisEnv = process.env.fortis_environment || 'dev';
      const env = fortisEnv === 'prd' ? 'production' : 'sandbox';
      const fortisClient = createFortisClient(
        env as 'sandbox' | 'production',
        fortisOnboarding.authUserId,
        fortisOnboarding.authUserApiKey
      );

      const result = await fortisClient.createTransactionIntention({
        location_id: locationId,
        action: 'store', // Store card/bank without charging
      });

      if (!result.status || !result.clientToken) {
        return NextResponse.json(
          { error: result.message || 'Failed to get payment form token' },
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
      const {
        token_id,
        last_four,
        account_holder_name,
        account_type, // 'visa', 'mc', 'amex', 'checking', 'savings'
        payment_method, // 'cc' or 'ach'
        exp_date,
      } = fortisResponse;

      if (!token_id) {
        return NextResponse.json(
          { error: 'Token ID is required' },
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

      // Parse expiration date if present
      let expMonth: number | null = null;
      let expYear: number | null = null;
      if (exp_date && exp_date.length === 4) {
        expMonth = parseInt(exp_date.substring(0, 2));
        expYear = parseInt('20' + exp_date.substring(2, 4));
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
