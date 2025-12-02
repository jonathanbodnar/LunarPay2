import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { z } from 'zod';

const generateStatementSchema = z.object({
  customerId: z.number(),
  dateFrom: z.string(),
  dateTo: z.string(),
});

export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();
    const { customerId, dateFrom, dateTo } = generateStatementSchema.parse(body);

    // Get customer
    const customer = await prisma.donor.findFirst({
      where: {
        id: customerId,
        userId: currentUser.userId,
      },
      include: {
        organization: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Get transactions in date range
    const transactions = await prisma.transaction.findMany({
      where: {
        donorId: customerId,
        createdAt: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo + 'T23:59:59.999Z'),
        },
      },
      include: {
        invoice: {
          select: {
            reference: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Generate PDF
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text('Customer Statement', 20, 20);

    // Customer info
    doc.setFontSize(10);
    doc.text(`Customer: ${customer.firstName} ${customer.lastName}`, 20, 35);
    doc.text(`Email: ${customer.email}`, 20, 41);
    doc.text(`Period: ${new Date(dateFrom).toLocaleDateString()} - ${new Date(dateTo).toLocaleDateString()}`, 20, 47);

    // Transactions table
    const tableData = transactions.map(t => [
      new Date(t.createdAt).toLocaleDateString(),
      t.invoice?.reference || `#${t.id}`,
      t.paymentMethod === 'card' ? 'Card' : 'ACH',
      `$${t.amount.toFixed(2)}`,
      t.status,
    ]);

    autoTable(doc, {
      startY: 55,
      head: [['Date', 'Reference', 'Method', 'Amount', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [84, 105, 212],
      },
    });

    // Summary
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const totalAmount = transactions.reduce((sum, t) => sum + (t.status === 'succeeded' ? t.amount : 0), 0);

    doc.setFontSize(12);
    doc.text(`Total Transactions: ${transactions.length}`, 20, finalY);
    doc.text(`Total Amount: $${totalAmount.toFixed(2)}`, 20, finalY + 7);

    // Footer
    const footerY = doc.internal.pageSize.height - 20;
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(customer.organization.name, 20, footerY);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, footerY + 5);

    // Return PDF
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="statement-${customer.id}-${dateFrom}-to-${dateTo}.pdf"`,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Generate statement error:', error);
    return NextResponse.json(
      { error: 'Failed to generate statement' },
      { status: 500 }
    );
  }
}

