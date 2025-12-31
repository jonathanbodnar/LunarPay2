import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().nonnegative().optional(),
  qty: z.number().nullable().optional(),
  isSubscription: z.boolean().optional(),
  subscriptionInterval: z.string().nullable().optional(),
  showOnPortal: z.boolean().optional(),
});

// GET /api/products/:id - Get single product
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireAuth();
    const productId = parseInt(id);

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        userId: currentUser.userId,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Get product error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/products/:id - Update product
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireAuth();
    const productId = parseInt(id);
    const body = await request.json();

    const validatedData = updateProductSchema.parse(body);

    // Verify ownership
    const existing = await prisma.product.findFirst({
      where: {
        id: productId,
        userId: currentUser.userId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        price: validatedData.price,
        qty: validatedData.qty,
        isSubscription: validatedData.isSubscription,
        subscriptionInterval: validatedData.subscriptionInterval,
        showOnPortal: validatedData.showOnPortal,
      },
    });

    return NextResponse.json({ product });
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

    console.error('Update product error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/:id - Delete product
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireAuth();
    const productId = parseInt(id);

    // Verify ownership
    const existing = await prisma.product.findFirst({
      where: {
        id: productId,
        userId: currentUser.userId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting trash to true
    await prisma.product.update({
      where: { id: productId },
      data: { trash: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Delete product error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

