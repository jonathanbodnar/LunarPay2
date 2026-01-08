import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateHash } from '@/lib/auth';
import { z } from 'zod';

const createPaymentLinkSchema = z.object({
  organizationId: z.number(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  paymentMethods: z.enum(['cc', 'ach', 'both']).default('both'),
  status: z.enum(['active', 'inactive']).default('active'),
  webhookUrl: z.string().url().optional().or(z.literal('')),
  products: z.array(z.object({
    productId: z.number(),
    qty: z.number().nullable(),
    unlimitedQty: z.boolean().default(false),
  })),
});

// GET /api/payment-links - List all payment links
export async function GET() {
  try {
    const currentUser = await requireAuth();

    const paymentLinks = await prisma.paymentLink.findMany({
      where: {
        organization: {
          userId: currentUser.userId,
        },
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
        _count: {
          select: {
            productsPaid: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ paymentLinks });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Get payment links error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/payment-links - Create new payment link
export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();

    console.log('Creating payment link with data:', JSON.stringify(body, null, 2));

    const validatedData = createPaymentLinkSchema.parse(body);

    // Verify organization ownership
    const organization = await prisma.organization.findFirst({
      where: {
        id: validatedData.organizationId,
        userId: currentUser.userId,
      },
      select: {
        id: true,
        // Note: primaryColor, backgroundColor, buttonTextColor columns don't exist in database
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Validate products exist and belong to the organization
    const productIds = validatedData.products.map(p => p.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        organizationId: validatedData.organizationId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (products.length !== productIds.length) {
      const foundIds = products.map(p => p.id);
      const missingIds = productIds.filter(id => !foundIds.includes(id));
      return NextResponse.json(
        { 
          error: 'One or more products not found or do not belong to this organization',
          details: `Product IDs not found: ${missingIds.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Generate unique hash
    let hash = generateHash();
    while (await prisma.paymentLink.findUnique({ where: { hash } })) {
      hash = generateHash();
    }

    // Create payment link
    const paymentLink = await prisma.paymentLink.create({
      data: {
        organizationId: validatedData.organizationId,
        name: validatedData.name,
        description: validatedData.description,
        status: validatedData.status,
        hash,
        paymentMethods: validatedData.paymentMethods,
        webhookUrl: validatedData.webhookUrl || null,
        products: {
          create: validatedData.products.map((product) => ({
            productId: product.productId,
            qty: product.qty,
            unlimitedQty: product.unlimitedQty,
          })),
        },
      },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json(
      { paymentLink },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Payment link validation error:', error.issues);
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

    console.error('Create payment link error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}

