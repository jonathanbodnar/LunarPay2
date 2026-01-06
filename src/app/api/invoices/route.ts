import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateHash } from '@/lib/auth';
import { sendInvoiceEmail } from '@/lib/email';
import { formatCurrency, formatDate } from '@/lib/utils';
import { z } from 'zod';

const createInvoiceSchema = z.object({
  organizationId: z.number(),
  donorId: z.number(),
  products: z.array(z.object({
    productId: z.number().optional().nullable(),
    productName: z.string().min(1, 'Product name is required'),
    qty: z.number().positive(),
    price: z.number().nonnegative(),
  })).min(1, 'At least one line item is required'),
  dueDate: z.string().optional().nullable(),
  memo: z.string().optional().nullable(),
  footer: z.string().optional().nullable(),
  paymentOptions: z.enum(['cc', 'ach', 'both']).default('both'),
  coverFee: z.boolean().default(false),
  sendNow: z.boolean().optional().default(false),
});

// GET /api/invoices - List all invoices
export async function GET(request: Request) {
  try {
    const currentUser = await requireAuth();
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const status = searchParams.get('status');

    const where: any = {
      organization: {
        userId: currentUser.userId,
      },
    };

    if (organizationId) {
      where.organizationId = parseInt(organizationId);
    }

    if (status) {
      where.status = status;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        donor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        products: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ invoices });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Get invoices error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/invoices - Create new invoice
export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();

    const validatedData = createInvoiceSchema.parse(body);

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

    // Verify donor exists
    const donor = await prisma.donor.findFirst({
      where: {
        id: validatedData.donorId,
        organizationId: validatedData.organizationId,
      },
    });

    if (!donor) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Calculate total
    const totalAmount = validatedData.products.reduce(
      (sum, product) => sum + product.price * product.qty,
      0
    );

    // Generate unique hash for invoice
    let hash = generateHash();
    while (await prisma.invoice.findUnique({ where: { hash } })) {
      hash = generateHash();
    }

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        organizationId: validatedData.organizationId,
        donorId: validatedData.donorId,
        status: validatedData.sendNow ? 'sent' : 'draft',
        totalAmount,
        paidAmount: 0,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        memo: validatedData.memo,
        footer: validatedData.footer,
        paymentOptions: validatedData.paymentOptions,
        coverFee: validatedData.coverFee,
        hash,
        sentAt: validatedData.sendNow ? new Date() : null,
        products: {
          create: validatedData.products.map((product) => ({
            productId: product.productId,
            productName: product.productName,
            qty: product.qty,
            price: product.price,
            subtotal: product.price * product.qty,
          })),
        },
      },
      include: {
        products: true,
        donor: true,
        organization: true,
      },
    });

    // Send email if sendNow is true and donor has email
    let emailSent = false;
    if (validatedData.sendNow && invoice.donor.email) {
      const customerName = `${invoice.donor.firstName || ''} ${invoice.donor.lastName || ''}`.trim() || 'Customer';
      const invoiceUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.lunarpay.com'}/invoice/${invoice.hash}`;
      
      console.log('[Invoice Create] Sending invoice email to:', invoice.donor.email);
      
      emailSent = await sendInvoiceEmail({
        customerName,
        customerEmail: invoice.donor.email,
        invoiceNumber: invoice.reference || `INV-${invoice.id}`,
        totalAmount: formatCurrency(totalAmount),
        dueDate: invoice.dueDate ? formatDate(invoice.dueDate.toISOString()) : undefined,
        invoiceUrl,
        organizationName: invoice.organization.name,
        organizationEmail: invoice.organization.email || undefined,
        organizationId: invoice.organizationId,
        memo: invoice.memo || undefined,
        brandColor: invoice.organization.primaryColor || undefined,
      });
      
      if (!emailSent) {
        console.error('[Invoice Create] Failed to send invoice email');
        // Update status back to draft if email failed
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { status: 'draft', sentAt: null },
        });
      }
    }

    return NextResponse.json(
      { 
        invoice,
        emailSent: validatedData.sendNow ? emailSent : undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Invoice validation error:', error.issues);
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

    console.error('Create invoice error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

