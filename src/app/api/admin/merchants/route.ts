import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    await requireAdmin();

    const merchants = await prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        fortisOnboarding: {
          select: {
            appStatus: true,
          },
        },
        transactions: {
          where: { status: 'successful' },
          select: { amount: true },
        },
        donors: {
          select: { id: true },
        },
        invoices: {
          select: { id: true },
        },
      },
    });

    const formattedMerchants = merchants.map(m => ({
      id: m.id,
      name: m.name,
      email: m.email,
      phone: m.phoneNumber,
      city: m.city,
      state: m.state,
      createdAt: m.createdAt.toISOString(),
      fortisStatus: m.fortisOnboarding?.appStatus || 'NOT_STARTED',
      totalProcessed: m.transactions.reduce((sum, t) => sum + Number(t.amount), 0),
      totalCustomers: m.donors.length,
      totalInvoices: m.invoices.length,
      ownerName: `${m.user.firstName || ''} ${m.user.lastName || ''}`.trim() || 'Unknown',
      ownerEmail: m.user.email,
    }));

    return NextResponse.json({
      merchants: formattedMerchants,
    });
  } catch (error) {
    if ((error as Error).message === 'AdminUnauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Admin merchants error:', error);
    return NextResponse.json({ error: 'Failed to fetch merchants' }, { status: 500 });
  }
}

