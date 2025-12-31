import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPortalSession } from '@/lib/portal-auth';

// GET /api/portal/payment-methods - Get customer's saved payment methods
export async function GET() {
  try {
    const session = await getPortalSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const paymentMethods = await prisma.source.findMany({
      where: {
        donorId: session.customerId,
        organizationId: session.organizationId,
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

    return NextResponse.json({ paymentMethods });
  } catch (error) {
    console.error('Get payment methods error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/portal/payment-methods - Delete a payment method
export async function DELETE(request: Request) {
  try {
    const session = await getPortalSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
        { status: 400 }
      );
    }

    // Verify the payment method belongs to this customer
    const paymentMethod = await prisma.source.findFirst({
      where: {
        id: parseInt(id),
        donorId: session.customerId,
        organizationId: session.organizationId,
      },
    });

    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      );
    }

    // Soft delete by marking as inactive
    await prisma.source.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete payment method error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/portal/payment-methods - Set default payment method
export async function PUT(request: Request) {
  try {
    const session = await getPortalSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
        { status: 400 }
      );
    }

    // Verify the payment method belongs to this customer
    const paymentMethod = await prisma.source.findFirst({
      where: {
        id: parseInt(id),
        donorId: session.customerId,
        organizationId: session.organizationId,
        isActive: true,
      },
    });

    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      );
    }

    // Remove default from all other payment methods
    await prisma.source.updateMany({
      where: {
        donorId: session.customerId,
        organizationId: session.organizationId,
        isDefault: true,
      },
      data: { isDefault: false },
    });

    // Set this one as default
    await prisma.source.update({
      where: { id: parseInt(id) },
      data: { isDefault: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Set default payment method error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

