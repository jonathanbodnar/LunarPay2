import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    await requireAdmin();

    // Get total merchants
    const totalMerchants = await prisma.organization.count();

    // Get active merchants (with ACTIVE Fortis status)
    const activeMerchants = await prisma.fortisOnboarding.count({
      where: { appStatus: 'ACTIVE' },
    });

    // Get pending applications
    const pendingApplications = await prisma.fortisOnboarding.count({
      where: {
        appStatus: {
          notIn: ['ACTIVE', 'DECLINED'],
        },
      },
    });

    // Get total processed (sum of all transactions)
    const totalProcessedResult = await prisma.transaction.aggregate({
      _sum: { totalAmount: true },
      where: { status: 'P' }, // P = successful
    });
    const totalProcessed = Number(totalProcessedResult._sum.totalAmount || 0);

    // Get total customers
    const totalCustomers = await prisma.donor.count();

    // Get open tickets
    const openTickets = await prisma.ticket.count({
      where: {
        status: {
          in: ['open', 'in_progress'],
        },
      },
    });

    // Get recurring revenue (total from active subscriptions)
    const activeSubscriptions = await prisma.subscription.findMany({
      where: { status: 'A' }, // A = Active
      select: { amount: true },
    });
    const recurringRevenue = activeSubscriptions.reduce((sum, sub) => sum + Number(sub.amount), 0);

    // Get total fees collected across all merchants
    const totalFeesResult = await prisma.transaction.aggregate({
      _sum: { fee: true },
      where: { status: 'P' }, // Successful transactions only
    });
    const totalFees = Number(totalFeesResult._sum.fee || 0);

    // Get recent merchants with their stats
    const recentMerchants = await prisma.organization.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        fortisOnboarding: {
          select: { appStatus: true },
        },
        transactions: {
          where: { status: 'P' }, // P = successful
          select: { totalAmount: true },
        },
      },
    });

    const formattedMerchants = recentMerchants.map(m => ({
      id: m.id,
      name: m.name,
      status: m.fortisOnboarding?.appStatus || 'NOT_STARTED',
      processed: m.transactions.reduce((sum, t) => sum + Number(t.totalAmount), 0),
      createdAt: m.createdAt.toISOString(),
    }));

    return NextResponse.json({
      totalMerchants,
      activeMerchants,
      pendingApplications,
      totalProcessed,
      totalCustomers,
      openTickets,
      recurringRevenue,
      totalFees,
      recentMerchants: formattedMerchants,
    });
  } catch (error) {
    if ((error as Error).message === 'AdminUnauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}

