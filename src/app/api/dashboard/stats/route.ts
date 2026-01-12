import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

type AggregateResult = {
  _sum: { totalAmount: Decimal | null; fee: Decimal | null };
};

export async function GET() {
  try {
    const currentUser = await requireAuth();

    // Get date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Initialize default values
    let totalRevenue: AggregateResult = { _sum: { totalAmount: null, fee: null } };
    let monthlyRevenue: AggregateResult = { _sum: { totalAmount: null, fee: null } };
    let yearlyRevenue: AggregateResult = { _sum: { totalAmount: null, fee: null } };
    let last30DaysRevenue: AggregateResult = { _sum: { totalAmount: null, fee: null } };
    let totalTransactions = 0;
    let monthlyTransactions = 0;
    let pendingInvoices = 0;
    let activeSubscriptions = 0;
    let totalCustomers = 0;
    let newCustomersThisMonth = 0;

    // Execute queries with individual error handling
    try {
      totalRevenue = await prisma.transaction.aggregate({
        where: { userId: currentUser.userId, status: 'P' },
        _sum: { totalAmount: true, fee: true },
      });
    } catch (e) { console.error('totalRevenue error:', e); }

    try {
      monthlyRevenue = await prisma.transaction.aggregate({
        where: { userId: currentUser.userId, status: 'P', createdAt: { gte: startOfMonth } },
        _sum: { totalAmount: true, fee: true },
      });
    } catch (e) { console.error('monthlyRevenue error:', e); }

    try {
      yearlyRevenue = await prisma.transaction.aggregate({
        where: { userId: currentUser.userId, status: 'P', createdAt: { gte: startOfYear } },
        _sum: { totalAmount: true, fee: true },
      });
    } catch (e) { console.error('yearlyRevenue error:', e); }

    try {
      last30DaysRevenue = await prisma.transaction.aggregate({
        where: { userId: currentUser.userId, status: 'P', createdAt: { gte: thirtyDaysAgo } },
        _sum: { totalAmount: true, fee: true },
      });
    } catch (e) { console.error('last30DaysRevenue error:', e); }

    try {
      totalTransactions = await prisma.transaction.count({
        where: { userId: currentUser.userId },
      });
    } catch (e) { console.error('totalTransactions error:', e); }

    try {
      monthlyTransactions = await prisma.transaction.count({
        where: { userId: currentUser.userId, createdAt: { gte: startOfMonth } },
      });
    } catch (e) { console.error('monthlyTransactions error:', e); }

    try {
      pendingInvoices = await prisma.invoice.count({
        where: {
          organization: { userId: currentUser.userId },
          status: { in: ['finalized', 'sent'] },
        },
      });
    } catch (e) { console.error('pendingInvoices error:', e); }

    try {
      activeSubscriptions = await prisma.subscription.count({
        where: {
          organization: { userId: currentUser.userId },
          status: 'A',
        },
      });
    } catch (e) { console.error('activeSubscriptions error:', e); }

    try {
      totalCustomers = await prisma.donor.count({
        where: { userId: currentUser.userId },
      });
    } catch (e) { console.error('totalCustomers error:', e); }

    try {
      newCustomersThisMonth = await prisma.donor.count({
        where: { userId: currentUser.userId, createdAt: { gte: startOfMonth } },
      });
    } catch (e) { console.error('newCustomersThisMonth error:', e); }

    // Get recurring revenue
    let recurringRevenue = 0;
    try {
      const activeSubs = await prisma.subscription.findMany({
        where: {
          organization: { userId: currentUser.userId },
          status: 'A',
        },
        select: { amount: true },
      });
      recurringRevenue = activeSubs.reduce((sum, sub) => sum + Number(sub.amount), 0);
    } catch (e) { console.error('recurringRevenue error:', e); }

    // Calculate net amounts
    const totalNet = Number(totalRevenue._sum.totalAmount || 0) - Number(totalRevenue._sum.fee || 0);
    const monthlyNet = Number(monthlyRevenue._sum.totalAmount || 0) - Number(monthlyRevenue._sum.fee || 0);
    const yearlyNet = Number(yearlyRevenue._sum.totalAmount || 0) - Number(yearlyRevenue._sum.fee || 0);

    return NextResponse.json({
      stats: {
        revenue: {
          total: Number(totalRevenue._sum.totalAmount || 0),
          monthly: Number(monthlyRevenue._sum.totalAmount || 0),
          yearly: Number(yearlyRevenue._sum.totalAmount || 0),
          last30Days: Number(last30DaysRevenue._sum.totalAmount || 0),
        },
        recurringRevenue,
        fees: {
          total: Number(totalRevenue._sum.fee || 0),
          monthly: Number(monthlyRevenue._sum.fee || 0),
          yearly: Number(yearlyRevenue._sum.fee || 0),
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
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}
