import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/invoices/public/:hash - Get invoice by hash (customer portal)
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
            id: true,
            name: true,
            logo: true,
            phoneNumber: true,
            email: true,
            website: true,
            streetAddress: true,
            city: true,
            state: true,
            postal: true,
          },
        },
        donor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
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

    // Don't allow access to draft invoices
    if (invoice.status === 'draft') {
      return NextResponse.json(
        { error: 'Invoice not available' },
        { status: 404 }
      );
    }

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error('Get public invoice error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

