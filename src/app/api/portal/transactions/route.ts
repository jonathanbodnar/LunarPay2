import { NextRequest, NextResponse } from 'next/server';
import { getPortalSession } from '@/lib/portal-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getPortalSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch transactions for this customer
    const transactions = await prisma.transaction.findMany({
      where: {
        donorId: session.donorId,
        organizationId: session.organizationId,
      },
      orderBy: {
        date: 'desc',
      },
      take: 50, // Limit to last 50 transactions
      select: {
        id: true,
        totalAmount: true,
        fee: true,
        source: true,
        bankType: true,
        status: true,
        transactionType: true,
        givingSource: true,
        date: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      transactions: transactions.map(t => ({
        id: Number(t.id),
        totalAmount: Number(t.totalAmount),
        fee: Number(t.fee),
        source: t.source,
        bankType: t.bankType,
        status: t.status,
        transactionType: t.transactionType,
        givingSource: t.givingSource,
        date: t.date?.toISOString() || t.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Portal transactions error:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

