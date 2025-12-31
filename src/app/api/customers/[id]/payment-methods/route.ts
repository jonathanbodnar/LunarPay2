import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // TODO: Integrate with Fortis to tokenize card/bank and get source details
    // For now, we'll create a placeholder entry
    const { type, lastDigits, bankType, nameHolder, expMonth, expYear, isDefault, fortisWalletId, fortisCustomerId } = body;

    // If setting as default, unset other defaults
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
        sourceType: type === 'bank' ? 'ach' : 'cc',
        bankType: type === 'bank' ? bankType : null,
        lastDigits,
        nameHolder,
        expMonth: type === 'card' ? expMonth : null,
        expYear: type === 'card' ? expYear : null,
        isDefault: isDefault || false,
        isActive: true,
        isSaved: true,
        // These would come from Fortis tokenization
        fortisWalletId: fortisWalletId || '',
        fortisCustomerId: fortisCustomerId || '',
      },
    });

    return NextResponse.json(
      { paymentMethod: source },
      { status: 201 }
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

