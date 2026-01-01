import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireAuth();
    const invoiceId = parseInt(id);

    // Get the original invoice
    const originalInvoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        organization: {
          userId: currentUser.userId,
        },
      },
      include: {
        products: true,
      },
    });

    if (!originalInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Generate new hash for the cloned invoice
    const newHash = crypto.randomBytes(32).toString('hex');

    // Create the cloned invoice
    const clonedInvoice = await prisma.invoice.create({
      data: {
        organizationId: originalInvoice.organizationId,
        subOrganizationId: originalInvoice.subOrganizationId,
        donorId: originalInvoice.donorId,
        status: 'draft',
        totalAmount: originalInvoice.totalAmount,
        paidAmount: 0,
        fee: originalInvoice.fee,
        dueDate: null, // Clear due date for new invoice
        reference: null, // Will be auto-generated or set later
        memo: originalInvoice.memo,
        footer: originalInvoice.footer,
        comment: originalInvoice.comment,
        tags: originalInvoice.tags,
        paymentOptions: originalInvoice.paymentOptions,
        coverFee: originalInvoice.coverFee,
        hash: newHash,
        postPurchaseLink: originalInvoice.postPurchaseLink,
        products: {
          create: originalInvoice.products.map(product => ({
            productId: product.productId,
            productName: product.productName,
            qty: product.qty,
            price: product.price,
            subtotal: product.subtotal,
          })),
        },
      },
      include: {
        products: true,
        donor: true,
        organization: true,
      },
    });

    return NextResponse.json({
      success: true,
      invoice: clonedInvoice,
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Clone invoice error:', error);
    return NextResponse.json(
      { error: 'Failed to clone invoice' },
      { status: 500 }
    );
  }
}

