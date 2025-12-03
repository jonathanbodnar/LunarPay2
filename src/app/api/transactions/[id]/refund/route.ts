import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireAuth();
    const transactionId = parseInt(id);

    // Verify transaction exists and belongs to user
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        organization: {
          userId: currentUser.userId,
        },
      },
      include: {
        organization: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    if (transaction.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Only succeeded transactions can be refunded' },
        { status: 400 }
      );
    }

    // TODO: Process refund through payment processor (Fortis/Paysafe)
    // For now, just mark as refunded in database
    
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'refunded',
        refundedAt: new Date(),
      },
    });

    // TODO: Create a refund record in refund tracking table
    // await prisma.refund.create({
    //   data: {
    //     transactionId: transaction.id,
    //     amount: Number(transaction.totalAmount),
    //     fee: Number(transaction.fee),
    //     status: 'succeeded',
    //     reason: 'Requested by merchant',
    //     processedBy: currentUser.userId,
    //   },
    // });

    return NextResponse.json({
      success: true,
      message: 'Transaction refunded successfully',
      transaction: updatedTransaction,
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Refund error:', error);
    return NextResponse.json(
      { error: 'Failed to process refund' },
      { status: 500 }
    );
  }
}

