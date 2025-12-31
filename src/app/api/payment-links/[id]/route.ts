import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updatePaymentLinkSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  paymentMethods: z.enum(['cc', 'ach', 'both']).optional(),
  webhookUrl: z.string().url().optional().or(z.literal('')).or(z.null()),
  products: z.array(z.object({
    productId: z.number(),
    qty: z.number().nullable(),
    unlimitedQty: z.boolean().default(false),
  })).optional(),
});

// GET /api/payment-links/:id - Get single payment link
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireAuth();
    const paymentLinkId = parseInt(id);

    const paymentLink = await prisma.paymentLink.findFirst({
      where: {
        id: paymentLinkId,
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
      },
    });

    if (!paymentLink) {
      return NextResponse.json(
        { error: 'Payment link not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ paymentLink });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Get payment link error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/payment-links/:id - Update payment link
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireAuth();
    const paymentLinkId = parseInt(id);
    const body = await request.json();

    const validatedData = updatePaymentLinkSchema.parse(body);

    // Verify ownership
    const existing = await prisma.paymentLink.findFirst({
      where: {
        id: paymentLinkId,
        organization: {
          userId: currentUser.userId,
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Payment link not found' },
        { status: 404 }
      );
    }

    // Update payment link
    const paymentLink = await prisma.paymentLink.update({
      where: { id: paymentLinkId },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        status: validatedData.status,
        paymentMethods: validatedData.paymentMethods,
        webhookUrl: validatedData.webhookUrl || null,
      },
    });

    // Update products if provided
    if (validatedData.products) {
      // Delete existing products
      await prisma.paymentLinkProduct.deleteMany({
        where: { paymentLinkId },
      });

      // Create new products
      await prisma.paymentLinkProduct.createMany({
        data: validatedData.products.map((product) => ({
          paymentLinkId,
          productId: product.productId,
          qty: product.qty,
          unlimitedQty: product.unlimitedQty,
        })),
      });
    }

    // Fetch updated payment link with products
    const updatedPaymentLink = await prisma.paymentLink.findUnique({
      where: { id: paymentLinkId },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json({ paymentLink: updatedPaymentLink });
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

    console.error('Update payment link error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/payment-links/:id - Delete payment link
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireAuth();
    const paymentLinkId = parseInt(id);

    // Verify ownership
    const existing = await prisma.paymentLink.findFirst({
      where: {
        id: paymentLinkId,
        organization: {
          userId: currentUser.userId,
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Payment link not found' },
        { status: 404 }
      );
    }

    // Delete products first (cascade should handle this but being explicit)
    await prisma.paymentLinkProduct.deleteMany({
      where: { paymentLinkId },
    });

    // Delete payment link
    await prisma.paymentLink.delete({
      where: { id: paymentLinkId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Delete payment link error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

