import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendInvoiceEmail } from '@/lib/email';
import { formatCurrency, formatDate } from '@/lib/utils';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireAuth();
    const invoiceId = parseInt(id);

    // Get base URL - prefer env variable for consistent URLs in emails
    const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://app.lunarpay.com';

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

    // Send invoice email using SendGrid
    const customerName = `${invoice.donor.firstName || ''} ${invoice.donor.lastName || ''}`.trim() || 'Customer';
    const invoiceUrl = `${baseUrl}/invoice/${invoice.hash}`;

    const emailSent = await sendInvoiceEmail({
      customerName,
      customerEmail: invoice.donor.email,
      invoiceNumber: invoice.reference || `INV-${invoice.id}`,
      totalAmount: formatCurrency(Number(invoice.totalAmount)),
      dueDate: invoice.dueDate ? formatDate(invoice.dueDate.toISOString()) : undefined,
      invoiceUrl,
      organizationName: invoice.organization.name,
      organizationEmail: invoice.organization.email || undefined,
      memo: invoice.memo || undefined,
      brandColor: undefined, // primaryColor column doesn't exist in database
    });

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send email' },
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
