import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateInvoicePDF } from '@/lib/pdf';

// GET /api/invoices/public/:hash/pdf - Get invoice PDF by hash (public access)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ hash: string }> }
) {
  try {
    const { hash } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { hash },
      include: {
        organization: {
          select: {
            name: true,
            phoneNumber: true,
            email: true,
            streetAddress: true,
            city: true,
            state: true,
            postal: true,
          },
        },
        donor: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            address: true,
          },
        },
        products: {
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Don't allow access to canceled invoices
    if (invoice.status === 'canceled') {
      return NextResponse.json(
        { error: 'This invoice has been canceled' },
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
    console.error('Generate public PDF error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

