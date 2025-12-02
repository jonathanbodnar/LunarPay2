import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateInvoicePDF } from '@/lib/pdf';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await requireAuth();
    const invoiceId = parseInt(params.id);

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

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoice as any);

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="invoice-${invoice.reference || invoice.id}.pdf"`,
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

