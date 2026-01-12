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
    
    // Determine if id is a numeric database ID or a Fortis transaction ID
    const isNumericId = /^\d+$/.test(id);
    const isFortisTransactionId = id.startsWith('txn_');
    
    let transaction;
    
    if (isNumericId) {
      // Query by database ID (BigInt)
      const transactionId = BigInt(id);
      transaction = await prisma.transaction.findFirst({
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
    } else if (isFortisTransactionId) {
      // Query by Fortis transaction ID (string)
      transaction = await prisma.transaction.findFirst({
        where: {
          fortisTransactionId: id,
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
    } else {
      // Invalid ID format
      return NextResponse.json(
        { error: 'Invalid transaction ID format' },
        { status: 400 }
      );
    }

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

    // Serialize transaction: convert BigInt IDs to strings for JSON
    const serializeTransaction = (tx: any): any => {
      if (!tx) return null;
      return {
        ...tx,
        id: tx.id.toString(), // Convert BigInt to string
        trxRetId: tx.trxRetId ? tx.trxRetId.toString() : null,
        trxRetOriginId: tx.trxRetOriginId ? tx.trxRetOriginId.toString() : null,
        donor: tx.donor ? {
          ...tx.donor,
          id: tx.donor.id, // Donor ID is Int, not BigInt
        } : null,
        organization: tx.organization ? {
          ...tx.organization,
          id: tx.organization.id, // Organization ID is Int, not BigInt
        } : null,
        invoice: tx.invoice ? {
          ...tx.invoice,
          id: tx.invoice.id, // Invoice ID is Int, not BigInt
        } : null,
        transactionFunds: tx.transactionFunds ? tx.transactionFunds.map((tf: any) => ({
          ...tf,
          transactionId: tf.transactionId ? tf.transactionId.toString() : null,
          fund: tf.fund ? {
            ...tf.fund,
            id: tf.fund.id, // Fund ID is Int, not BigInt
          } : null,
        })) : [],
      };
    };

    return NextResponse.json({
      transaction: serializeTransaction({
        ...transaction,
        refundTransaction: refundTransaction ? serializeTransaction(refundTransaction) : null,
        originalTransaction: originalTransaction ? serializeTransaction(originalTransaction) : null,
      }),
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

