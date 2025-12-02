import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET() {
  try {
    // Get customer session from cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('customer_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    let customerId: number;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      customerId = decoded.customerId;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Get customer data
    const customer = await prisma.donor.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Get transactions
    const transactions = await prisma.transaction.findMany({
      where: { donorId: customerId },
      include: {
        invoice: {
          select: {
            reference: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Get saved payment methods
    const savedPaymentMethods = await prisma.source.findMany({
      where: { donorId: customerId },
      orderBy: { createdAt: 'desc' },
    });

    // Get subscriptions
    const subscriptions = await prisma.subscription.findMany({
      where: { donorId: customerId },
      orderBy: { createdAt: 'desc' },
    });

    // Get invoices
    const invoices = await prisma.invoice.findMany({
      where: { donorId: customerId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      customer,
      transactions,
      savedPaymentMethods,
      subscriptions,
      invoices,
    });
  } catch (error) {
    console.error('Customer portal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

