import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateCustomerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const customerId = parseInt(id);

    // First, get the user's organizations
    const userOrganizations = await prisma.organization.findMany({
      where: { userId: currentUser.userId },
      select: { id: true },
    });
    const orgIds = userOrganizations.map(org => org.id);

    // Find customer that belongs to user directly OR to user's organizations
    const customer = await prisma.donor.findFirst({
      where: {
        id: customerId,
        OR: [
          { userId: currentUser.userId },
          { organizationId: { in: orgIds } },
        ],
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Last 10 transactions
          select: {
            id: true,
            totalAmount: true,
            source: true,
            status: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            transactions: true,
            sources: true,
            invoices: true,
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

    return NextResponse.json({ customer });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Get customer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const customerId = parseInt(id);
    const body = await request.json();

    const validatedData = updateCustomerSchema.parse(body);

    // Get user's organizations
    const userOrganizations = await prisma.organization.findMany({
      where: { userId: currentUser.userId },
      select: { id: true },
    });
    const orgIds = userOrganizations.map(org => org.id);

    // Verify ownership (direct or via organization)
    const existing = await prisma.donor.findFirst({
      where: {
        id: customerId,
        OR: [
          { userId: currentUser.userId },
          { organizationId: { in: orgIds } },
        ],
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Update customer
    const customer = await prisma.donor.update({
      where: { id: customerId },
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        phone: validatedData.phone,
        address: validatedData.address,
        city: validatedData.city,
        state: validatedData.state,
        zip: validatedData.zip,
      },
    });

    return NextResponse.json({ customer });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Update customer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const customerId = parseInt(id);

    // Get user's organizations
    const userOrganizations = await prisma.organization.findMany({
      where: { userId: currentUser.userId },
      select: { id: true },
    });
    const orgIds = userOrganizations.map(org => org.id);

    const existing = await prisma.donor.findFirst({
      where: {
        id: customerId,
        OR: [
          { userId: currentUser.userId },
          { organizationId: { in: orgIds } },
        ],
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    await prisma.donor.delete({
      where: { id: customerId },
    });

    return NextResponse.json({
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
