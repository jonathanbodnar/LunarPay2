import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/payouts
 * Calculate payouts from transaction data
 * Groups transactions by day to show settlement history
 */
export async function GET(request: Request) {
  try {
    const currentUser = await requireAuth();
    
    // Get organization
    const organization = await prisma.organization.findFirst({
      where: { userId: currentUser.userId },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Calculate payouts from transactions
    const payoutData = await calculatePayoutsFromTransactions(organization.id);
    
    return NextResponse.json(payoutData);
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('[Payouts API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payouts' },
      { status: 500 }
    );
  }
}

/**
 * Calculate payouts from local transaction data
 * Groups transactions by day and shows what has been processed
 */
async function calculatePayoutsFromTransactions(organizationId: number) {
  // Get all transactions (successful and refunded)
  const transactions = await prisma.transaction.findMany({
    where: {
      organizationId,
      status: { in: ['P', 'R'] }, // Successful and Refunded transactions
    },
    select: {
      id: true,
      totalAmount: true,
      subTotalAmount: true,
      fee: true,
      status: true, // P = Success, R = Refunded
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 500, // Last 500 transactions for grouping
  });

  // Group by date
  const groupedByDate = new Map<string, {
    date: string;
    totalAmount: number;
    totalFees: number;
    netAmount: number;
    count: number;
    refundAmount: number;
    refundCount: number;
  }>();

  for (const tx of transactions) {
    const dateKey = tx.createdAt.toISOString().split('T')[0];
    const existing = groupedByDate.get(dateKey) || {
      date: dateKey,
      totalAmount: 0,
      totalFees: 0,
      netAmount: 0,
      count: 0,
      refundAmount: 0,
      refundCount: 0,
    };

    const amount = Number(tx.totalAmount) || 0;
    const fee = Number(tx.fee) || 0;

    if (tx.status === 'R') {
      // Refunded transaction
      existing.refundAmount += amount;
      existing.refundCount += 1;
    } else {
      // Successful transaction
      existing.totalAmount += amount;
      existing.totalFees += fee;
      existing.netAmount += amount - fee;
      existing.count += 1;
    }

    groupedByDate.set(dateKey, existing);
  }

  // Convert to payouts array (most recent first)
  const payouts = Array.from(groupedByDate.values())
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((day, index) => ({
      id: index + 1,
      amount: day.totalAmount,
      fee: day.totalFees,
      net: day.netAmount - day.refundAmount,
      status: 'paid', // Assume processed
      transactionCount: day.count,
      createdAt: `${day.date}T00:00:00.000Z`,
      paidAt: `${day.date}T23:59:59.000Z`, // Same day settlement assumed
      periodStart: `${day.date}T00:00:00.000Z`,
      periodEnd: `${day.date}T23:59:59.000Z`,
    }));

  // Calculate totals
  const totalPaidOut = payouts.reduce((sum, p) => sum + p.net, 0);

  // Pending = transactions from today (not yet settled)
  const today = new Date().toISOString().split('T')[0];
  const todayData = groupedByDate.get(today);
  const pendingPayout = todayData ? todayData.netAmount - todayData.refundAmount : 0;

  return {
    payouts: payouts.slice(0, 50), // Return last 50 daily payouts
    stats: {
      totalPaidOut,
      pendingPayout,
      nextPayoutDate: null,
    },
  };
}
