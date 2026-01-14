import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const startTime = Date.now();
  try {
    const currentUser = await requireAuth();
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status');
    const paymentMethod = searchParams.get('paymentMethod');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const organizationId = searchParams.get('organizationId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;

    console.log(`[Transactions API] GET request - User: ${currentUser.userId}, Filters:`, {
      status,
      paymentMethod,
      search: search ? '***' : null,
      dateFrom,
      dateTo,
      organizationId,
      limit,
    });

    const where: any = {
      organization: {
        userId: currentUser.userId,
      },
    };

    if (status) {
      where.status = status;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    if (organizationId) {
      where.organizationId = parseInt(organizationId);
    }

    if (search) {
      where.OR = [
        { donor: { firstName: { contains: search, mode: 'insensitive' } } },
        { donor: { lastName: { contains: search, mode: 'insensitive' } } },
        { donor: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z');
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        donor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Serialize transactions: convert BigInt IDs to strings and map fields for frontend
    const serializedTransactions = transactions.map((tx: any) => ({
      ...tx,
      id: tx.id.toString(), // Convert BigInt to string
      // Map database fields to frontend expected fields
      amount: Number(tx.totalAmount) || 0, // Convert Decimal to number
      fee: Number(tx.fee) || 0,
      paymentMethod: tx.source === 'CC' ? 'card' : tx.source === 'BNK' ? 'ach' : 'card', // Map source to paymentMethod
      donor: tx.donor ? {
        ...tx.donor,
        id: tx.donor.id, // Donor ID is Int, not BigInt
      } : null,
      organization: tx.organization ? {
        ...tx.organization,
        id: tx.organization.id, // Organization ID is Int, not BigInt
      } : null,
    }));

    const duration = Date.now() - startTime;
    console.log(`[Transactions API] Success - Found ${serializedTransactions.length} transactions in ${duration}ms`);

    return NextResponse.json({ transactions: serializedTransactions });
  } catch (error) {
    const duration = Date.now() - startTime;
    if ((error as Error).message === 'Unauthorized') {
      console.warn(`[Transactions API] Unauthorized access attempt - Duration: ${duration}ms`);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error(`[Transactions API] Error after ${duration}ms:`, {
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


