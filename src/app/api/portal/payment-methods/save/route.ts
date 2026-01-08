import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPortalSession } from '@/lib/portal-auth';

// POST /api/portal/payment-methods/save - Save a tokenized payment method
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
    const { fortisResponse, setAsDefault = false } = body;

    console.log('[Portal Save Payment] Received:', JSON.stringify(fortisResponse, null, 2));

    if (!fortisResponse) {
      return NextResponse.json(
        { error: 'Payment response data is required' },
        { status: 400 }
      );
    }

    // Extract token data from Fortis response
    const txData = fortisResponse.transaction || fortisResponse.data || fortisResponse;
    
    const token_id = txData.id || txData.token_id || txData.tokenId;
    const last_four = txData.last_four || txData.lastFour || txData.last4 || '';
    const account_holder_name = txData.account_holder_name || txData.accountHolderName || '';
    const account_type = txData.account_type || txData.accountType || txData.card_type || '';
    const payment_method = txData.payment_method || txData.paymentMethod || 
      (account_type?.toLowerCase()?.includes('check') ? 'ach' : 'cc');
    const exp_date = txData.exp_date || txData.expDate || '';

    if (!token_id) {
      console.error('[Portal Save Payment] No token ID in response');
      return NextResponse.json(
        { error: 'Failed to save payment method - no token received' },
        { status: 400 }
      );
    }

    // Check if this token already exists
    const existingSource = await prisma.source.findFirst({
      where: {
        fortisWalletId: token_id,
        donorId: session.customerId,
        organizationId: session.organizationId,
      },
    });

    if (existingSource) {
      return NextResponse.json({
        success: true,
        paymentMethod: existingSource,
        message: 'Payment method already saved',
      });
    }

    // Parse expiration date
    let expMonth: string | null = null;
    let expYear: string | null = null;
    if (exp_date && exp_date.length === 4) {
      expMonth = exp_date.substring(0, 2);
      expYear = '20' + exp_date.substring(2, 4);
    }

    // If setting as default, remove default from other methods
    if (setAsDefault) {
      await prisma.source.updateMany({
        where: {
          donorId: session.customerId,
          organizationId: session.organizationId,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    // Check if customer has any other payment methods
    const existingMethods = await prisma.source.count({
      where: {
        donorId: session.customerId,
        organizationId: session.organizationId,
        isActive: true,
      },
    });

    // Create new payment method
    const paymentMethod = await prisma.source.create({
      data: {
        donorId: session.customerId,
        organizationId: session.organizationId,
        sourceType: payment_method === 'ach' ? 'ach' : 'cc',
        bankType: account_type || null,
        lastDigits: last_four,
        nameHolder: account_holder_name,
        expMonth,
        expYear,
        isDefault: setAsDefault || existingMethods === 0, // Default if first method or explicitly set
        isActive: true,
        isSaved: true,
        fortisWalletId: token_id,
        fortisCustomerId: session.customerId.toString(),
      },
    });

    return NextResponse.json({
      success: true,
      paymentMethod,
      message: 'Payment method saved successfully',
    });
  } catch (error) {
    console.error('[Portal Save Payment] Error:', error);
    return NextResponse.json(
      { error: 'Failed to save payment method' },
      { status: 500 }
    );
  }
}

