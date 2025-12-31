import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateInvoicePDF } from '@/lib/pdf';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireAuth();
    const invoiceId = parseInt(id);

    // Get invoice with all details
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        organization: {
          userId: currentUser.userId,
        },
      },
      include: {
        donor: true,
        organization: true,
        products: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Format invoice data for PDF generation
    const invoiceData = {
      id: invoice.id,
      reference: invoice.reference,
      totalAmount: Number(invoice.totalAmount),
      fee: Number(invoice.fee || 0),
      dueDate: invoice.dueDate?.toISOString() || null,
      memo: invoice.memo,
      footer: invoice.footer,
      createdAt: invoice.createdAt.toISOString(),
      hash: invoice.hash,
      coverFee: invoice.coverFee,
      donor: {
        firstName: invoice.donor?.firstName || null,
        lastName: invoice.donor?.lastName || null,
        email: invoice.donor?.email || null,
        address: invoice.donor?.address || null,
      },
      organization: {
        name: invoice.organization?.name || 'Unknown',
        phone: invoice.organization?.phoneNumber || null,
        email: invoice.organization?.email || null,
        address: invoice.organization ? 
          [invoice.organization.streetAddress, invoice.organization.city, invoice.organization.state, invoice.organization.postal]
            .filter(Boolean)
            .join(', ') : null,
        logo: invoice.organization?.logo || null,
      },
      products: invoice.products.map(p => ({
        productName: p.productName,
        qty: Number(p.qty),
        price: Number(p.price),
        subtotal: Number(p.subtotal),
      })),
    };

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoiceData);

    // Return PDF - convert Buffer to Uint8Array for NextResponse compatibility
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.reference || invoice.id}.pdf"`,
      },
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Generate PDF error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

