import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireAuth();
    const transactionId = BigInt(id);

    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        organization: {
          userId: currentUser.userId,
        },
      },
      include: {
        donor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            zip: true,
            country: true,
            amountAcum: true,
            feeAcum: true,
            netAcum: true,
            firstDate: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            legalName: true,
            email: true,
            phoneNumber: true,
          },
        },
        invoice: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            paidAmount: true,
            hash: true,
            reference: true,
            memo: true,
          },
        },
        transactionFunds: {
          include: {
            fund: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Get refund transaction if exists
    let refundTransaction = null;
    if (transaction.trxRetId) {
      refundTransaction = await prisma.transaction.findUnique({
        where: { id: transaction.trxRetId },
        include: {
          donor: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    }

    // Get original transaction if this is a refund
    let originalTransaction = null;
    if (transaction.trxRetOriginId) {
      originalTransaction = await prisma.transaction.findUnique({
        where: { id: transaction.trxRetOriginId },
        include: {
          donor: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    }

    return NextResponse.json({
      transaction: {
        ...transaction,
        refundTransaction,
        originalTransaction,
      },
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Get transaction error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

