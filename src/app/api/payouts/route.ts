import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { FortisClient } from '@/lib/fortis/client';

/**
 * GET /api/payouts
 * Fetch payouts (settlement batches) from Fortis for the merchant
 * Shows money transferred from Fortis to the merchant's bank account
 */
export async function GET(request: Request) {
  try {
    const currentUser = await requireAuth();
    
    // Get organization with Fortis credentials
    const organization = await prisma.organization.findFirst({
      where: { userId: currentUser.userId },
      include: {
        fortisOnboarding: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if Fortis is configured
    if (!organization.fortisOnboarding?.authUserId || !organization.fortisOnboarding?.authUserApiKey) {
      return NextResponse.json({
        payouts: [],
        stats: {
          totalPaidOut: 0,
          pendingPayout: 0,
          nextPayoutDate: null,
        },
        message: 'Fortis account not configured or pending approval',
      });
    }

    // Initialize Fortis client with merchant credentials
    const fortisClient = new FortisClient({
      developerId: process.env.FORTIS_DEVELOPER_ID_PRODUCTION || process.env.FORTIS_DEVELOPER_ID_SANDBOX || '',
      userId: organization.fortisOnboarding.authUserId,
      userApiKey: organization.fortisOnboarding.authUserApiKey,
      environment: (process.env.FORTIS_ENVIRONMENT as 'sandbox' | 'production') || 'production',
    });

    // Get query params for pagination/filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    console.log('[Payouts API] Fetching from Fortis for org:', organization.id, organization.name);

    // Get transaction batches from Fortis (this is the primary source for payout data)
    const batches = await fortisClient.getTransactionBatches({
      page,
      pageSize,
    });

    console.log('[Payouts API] Fortis batches response:', {
      status: batches.status,
      count: batches.batches?.length || 0,
      message: batches.message,
    });

    // If Fortis returns batch data, use it
    if (batches.status && batches.batches && batches.batches.length > 0) {
      // Transform batches to payout format
      const payouts = batches.batches
        .filter(batch => !batch.is_open) // Only closed batches are settled
        .map(batch => ({
          id: batch.id,
          batchNumber: batch.batch_num,
          amount: batch.total_sale_amount / 100, // Convert from cents
          refunds: batch.total_refund_amount / 100,
          net: (batch.total_sale_amount - batch.total_refund_amount) / 100,
          fee: 0, // Fees might be calculated separately
          status: batch.is_open ? 'pending' : 'paid',
          transactionCount: batch.total_sale_count,
          refundCount: batch.total_refund_count,
          createdAt: new Date(batch.created_ts * 1000).toISOString(),
          paidAt: batch.batch_close_ts ? new Date(batch.batch_close_ts * 1000).toISOString() : null,
          periodStart: new Date(batch.created_ts * 1000).toISOString(),
          periodEnd: batch.batch_close_ts ? new Date(batch.batch_close_ts * 1000).toISOString() : new Date().toISOString(),
        }));

      // Calculate stats
      const totalPaidOut = payouts
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.net, 0);
      
      const pendingPayout = payouts
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + p.net, 0);

      // Get pending batches for next payout estimate
      const pendingBatches = batches.batches.filter(b => b.is_open) || [];
      const pendingTotal = pendingBatches.reduce(
        (sum, b) => sum + (b.total_sale_amount - b.total_refund_amount), 
        0
      ) / 100;

      return NextResponse.json({
        payouts,
        stats: {
          totalPaidOut,
          pendingPayout: pendingTotal || pendingPayout,
          nextPayoutDate: null, // Fortis typically settles daily
        },
        source: 'fortis_batches',
        pagination: batches.pagination,
      });
    }

    // If batches didn't work, try settlements endpoint
    console.log('[Payouts API] No batches from Fortis, trying settlements...');
    const settlements = await fortisClient.getSettlements({ page, pageSize });
    
    console.log('[Payouts API] Fortis settlements response:', {
      status: settlements.status,
      count: settlements.settlements?.length || 0,
      message: settlements.message,
    });

    if (settlements.status && settlements.settlements && settlements.settlements.length > 0) {
      // Transform settlements to payout format
      const payouts = settlements.settlements.map(settlement => ({
        id: settlement.id,
        amount: settlement.gross_amount / 100,
        fee: settlement.fee_amount / 100,
        net: settlement.net_amount / 100,
        status: settlement.status === 'settled' ? 'paid' : 'pending',
        transactionCount: settlement.transaction_count,
        createdAt: new Date(settlement.settlement_date * 1000).toISOString(),
        paidAt: settlement.deposit_date ? new Date(settlement.deposit_date * 1000).toISOString() : null,
        periodStart: new Date(settlement.batch_date * 1000).toISOString(),
        periodEnd: new Date(settlement.settlement_date * 1000).toISOString(),
      }));

      const totalPaidOut = payouts
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.net, 0);
      
      const pendingPayout = payouts
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + p.net, 0);

      return NextResponse.json({
        payouts,
        stats: {
          totalPaidOut,
          pendingPayout,
          nextPayoutDate: null,
        },
        source: 'fortis_settlements',
      });
    }

    // If both Fortis methods fail, fall back to local transaction calculation
    // This should only happen if Fortis doesn't have batch/settlement data yet
    console.log('[Payouts API] No data from Fortis, falling back to local calculation');
    
    // This is a fallback when Fortis API doesn't have settlement data yet
    const localPayouts = await calculatePayoutsFromTransactions(organization.id);
    
    return NextResponse.json(localPayouts);
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('Payouts API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payouts' },
      { status: 500 }
    );
  }
}

/**
 * Fallback: Calculate payouts from local transaction data
 * Groups transactions by day and shows what should have been deposited
 */
async function calculatePayoutsFromTransactions(organizationId: number) {
  // Get all transactions (successful and refunded) grouped by date
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
    source: 'local_transactions',
    message: 'Calculated from local transaction data',
  };
}

