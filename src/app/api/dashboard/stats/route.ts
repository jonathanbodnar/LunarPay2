import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const currentUser = await requireAuth();

    // Get date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all transactions for user's organizations
    const [
      totalRevenue,
      monthlyRevenue,
      yearlyRevenue,
      last30DaysRevenue,
      totalTransactions,
      monthlyTransactions,
      pendingInvoices,
      activeSubscriptions,
      totalCustomers,
      newCustomersThisMonth,
      revenueByDay,
      transactionsByStatus,
      paymentMethodBreakdown,
    ] = await Promise.all([
      // Total revenue
      prisma.transaction.aggregate({
        where: {
          userId: currentUser.userId,
          status: 'P',
        },
        _sum: { totalAmount: true, fee: true },
      }),
      
      // Monthly revenue
      prisma.transaction.aggregate({
        where: {
          userId: currentUser.userId,
          status: 'P',
          createdAt: { gte: startOfMonth },
        },
        _sum: { totalAmount: true, fee: true },
      }),
      
      // Yearly revenue
      prisma.transaction.aggregate({
        where: {
          userId: currentUser.userId,
          status: 'P',
          createdAt: { gte: startOfYear },
        },
        _sum: { totalAmount: true, fee: true },
      }),
      
      // Last 30 days revenue
      prisma.transaction.aggregate({
        where: {
          userId: currentUser.userId,
          status: 'P',
          createdAt: { gte: thirtyDaysAgo },
        },
        _sum: { totalAmount: true, fee: true },
      }),
      
      // Total transactions
      prisma.transaction.count({
        where: {
          userId: currentUser.userId,
        },
      }),
      
      // Monthly transactions
      prisma.transaction.count({
        where: {
          userId: currentUser.userId,
          createdAt: { gte: startOfMonth },
        },
      }),
      
      // Pending invoices
      prisma.invoice.count({
        where: {
          organization: { userId: currentUser.userId },
          status: { in: ['finalized', 'sent'] },
        },
      }),
      
      // Active subscriptions
      prisma.subscription.count({
        where: {
          organization: { userId: currentUser.userId },
          status: 'active',
        },
      }),
      
      // Total customers
      prisma.donor.count({
        where: {
          userId: currentUser.userId,
        },
      }),
      
      // New customers this month
      prisma.donor.count({
        where: {
          userId: currentUser.userId,
          createdAt: { gte: startOfMonth },
        },
      }),
      
      // Revenue by day (last 30 days)
      prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          SUM(amount) as amount,
          COUNT(*) as count
        FROM transactions t
        INNER JOIN organizations o ON t.organization_id = o.id
        WHERE o.user_id = ${currentUser.userId}
          AND t.status = 'succeeded'
          AND t.created_at >= ${thirtyDaysAgo}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
      
      // Transactions by status
      prisma.transaction.groupBy({
        by: ['status'],
        where: {
          userId: currentUser.userId,
        },
        _count: true,
        _sum: { totalAmount: true },
      }),
      
      // Payment method breakdown
      prisma.transaction.groupBy({
        by: ['source'],
        where: {
          userId: currentUser.userId,
          status: 'P',
        },
        _count: true,
        _sum: { totalAmount: true },
      }),
    ]);

    // Calculate net amounts
    const totalNet = (totalRevenue._sum.totalAmount || 0) - (totalRevenue._sum.fee || 0);
    const monthlyNet = (monthlyRevenue._sum.totalAmount || 0) - (monthlyRevenue._sum.fee || 0);
    const yearlyNet = (yearlyRevenue._sum.totalAmount || 0) - (yearlyRevenue._sum.fee || 0);

    return NextResponse.json({
      stats: {
        revenue: {
          total: totalRevenue._sum.totalAmount || 0,
          monthly: monthlyRevenue._sum.totalAmount || 0,
          yearly: yearlyRevenue._sum.totalAmount || 0,
          last30Days: last30DaysRevenue._sum.totalAmount || 0,
        },
        fees: {
          total: totalRevenue._sum.fee || 0,
          monthly: monthlyRevenue._sum.fee || 0,
          yearly: yearlyRevenue._sum.fee || 0,
        },
        net: {
          total: totalNet,
          monthly: monthlyNet,
          yearly: yearlyNet,
        },
        transactions: {
          total: totalTransactions,
          monthly: monthlyTransactions,
        },
        invoices: {
          pending: pendingInvoices,
        },
        subscriptions: {
          active: activeSubscriptions,
        },
        customers: {
          total: totalCustomers,
          newThisMonth: newCustomersThisMonth,
        },
      },
      charts: {
        revenueByDay,
        transactionsByStatus,
        paymentMethodBreakdown,
      },
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

