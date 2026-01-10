import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createCustomerSchema = z.object({
  organizationId: z.number(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
});

// GET /api/customers - List all customers
export async function GET(request: Request) {
  try {
    const currentUser = await requireAuth();
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    const where: any = {
      userId: currentUser.userId,
    };

    if (organizationId) {
      where.organizationId = parseInt(organizationId);
    }

    const customers = await prisma.donor.findMany({
      where,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        sources: {
          where: { isActive: true },
          orderBy: { isDefault: 'desc' },
          take: 1,
          select: {
            id: true,
            sourceType: true,
            lastDigits: true,
            bankType: true,
            isDefault: true,
          },
        },
        _count: {
          select: {
            transactions: true,
            sources: true,
            subscriptions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Format customers with default payment method info
    const formattedCustomers = customers.map(customer => ({
      ...customer,
      defaultPaymentMethod: customer.sources[0] || null,
    }));

    return NextResponse.json({ customers: formattedCustomers });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Get customers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/customers - Create new customer
export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();

    const validatedData = createCustomerSchema.parse(body);

    // Verify organization ownership
    const organization = await prisma.organization.findFirst({
      where: {
        id: validatedData.organizationId,
        userId: currentUser.userId,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Create customer
    const customer = await prisma.donor.create({
      data: {
        userId: currentUser.userId,
        organizationId: validatedData.organizationId,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        phone: validatedData.phone,
        address: validatedData.address,
        city: validatedData.city,
        state: validatedData.state,
        zip: validatedData.zip,
        country: validatedData.country,
        createdFrom: 'dashboard',
        amountAcum: 0,
        feeAcum: 0,
        netAcum: 0,
      },
    });

    return NextResponse.json(
      { customer },
      { status: 201 }
    );
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

    console.error('Create customer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

