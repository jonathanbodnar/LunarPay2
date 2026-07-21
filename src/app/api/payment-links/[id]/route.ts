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
  webhookFormat: z.enum(['lunarpay', 'stripe']).optional(),
  redirectUrl: z.string().url().optional().or(z.literal('')).or(z.null()),
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
        webhookFormat: validatedData.webhookFormat,
        redirectUrl: validatedData.redirectUrl || null,
      },
    });

    // Reconcile products if provided.
    //
    // We must NOT blindly delete-and-recreate the link's products: once a link
    // has sales, payment_link_products_paid references payment_link_products via
    // a RESTRICT foreign key, so deleting a purchased product throws (which
    // surfaced as a 500 when editing any link that already had a payment).
    // Instead: upsert the incoming products, and only delete removed products
    // that have no recorded sales.
    if (validatedData.products) {
      const incoming = validatedData.products;
      const existingProducts = await prisma.paymentLinkProduct.findMany({
        where: { paymentLinkId },
      });

      for (const product of incoming) {
        const match = existingProducts.find((e) => e.productId === product.productId);
        if (match) {
          await prisma.paymentLinkProduct.update({
            where: { id: match.id },
            data: { qty: product.qty, unlimitedQty: product.unlimitedQty },
          });
        } else {
          await prisma.paymentLinkProduct.create({
            data: {
              paymentLinkId,
              productId: product.productId,
              qty: product.qty,
              unlimitedQty: product.unlimitedQty,
            },
          });
        }
      }

      const incomingProductIds = new Set(incoming.map((p) => p.productId));
      const removable = existingProducts.filter((e) => !incomingProductIds.has(e.productId));
      for (const e of removable) {
        const paidCount = await prisma.paymentLinkProductPaid.count({
          where: { paymentLinkProductId: e.id },
        });
        if (paidCount === 0) {
          await prisma.paymentLinkProduct.delete({ where: { id: e.id } });
        } else {
          console.warn(
            `[payment-links] Keeping product ${e.productId} on link ${paymentLinkId}: ${paidCount} sale(s) reference it`,
          );
        }
      }
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
      {
        error: 'Internal server error',
        message: (error as Error).message,
        code: (error as { code?: string }).code,
      },
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

