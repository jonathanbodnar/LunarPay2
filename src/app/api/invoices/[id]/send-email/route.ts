import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail, generateInvoiceEmailHTML } from '@/lib/email';
import { generateInvoicePDF } from '@/lib/pdf';

export async function POST(
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

    if (!invoice.donor.email) {
      return NextResponse.json(
        { error: 'Customer has no email address' },
        { status: 400 }
      );
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoice as any);

    // Generate email HTML
    const emailHTML = generateInvoiceEmailHTML(invoice);

    // Send email with PDF attachment
    const result = await sendEmail({
      to: invoice.donor.email,
      subject: `Invoice from ${invoice.organization.name} - #${invoice.reference || invoice.id}`,
      html: emailHTML,
      attachments: [
        {
          filename: `invoice-${invoice.reference || invoice.id}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error },
        { status: 500 }
      );
    }

    // Update invoice status to sent
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'sent',
        sentAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Invoice sent successfully',
      messageId: result.messageId,
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Send invoice email error:', error);
    return NextResponse.json(
      { error: 'Failed to send invoice' },
      { status: 500 }
    );
  }
}

