import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createFortisClient } from '@/lib/fortis/client';
import { dollarsToCents, calculateFee } from '@/lib/utils';

const ADMIN_TRIGGER_KEY = process.env.CRON_ADMIN_KEY;

/**
 * Cron job to process scheduled payments that are due today or earlier.
 *
 * Schedule alongside the subscriptions cron:
 *   "0 2 * * *" (2 AM UTC daily)
 *   GET /api/cron/process-scheduled-payments
 */

export async function GET(request: Request) {
  return processScheduledPayments(request);
}

export async function POST(request: Request) {
  return processScheduledPayments(request);
}

async function processScheduledPayments(request: Request) {
  console.log('[CRON:SCHEDULED] Started at:', new Date().toISOString());

  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const vercelCronHeader = request.headers.get('x-vercel-cron');
    const url = new URL(request.url);
    const adminTrigger = url.searchParams.get('admin_key');
    const isAdminTrigger = ADMIN_TRIGGER_KEY && adminTrigger === ADMIN_TRIGGER_KEY;

    if (cronSecret && !vercelCronHeader && !isAdminTrigger && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const duePayments = await prisma.scheduledPayment.findMany({
      where: {
        status: 'pending',
        dueDate: { lte: endOfToday },
        schedule: { status: 'active' },
      },
      include: {
        schedule: {
          include: {
            customer: true,
            source: true,
            organization: {
              include: { fortisOnboarding: true },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    console.log('[CRON:SCHEDULED] Found', duePayments.length, 'payments due');

    const results = { total: duePayments.length, successful: 0, failed: 0, skipped: 0, details: [] as any[] };

    for (const payment of duePayments) {
      const { schedule } = payment;
      const org = schedule.organization;
      const fortis = org.fortisOnboarding;

      if (!fortis?.authUserId || !fortis?.authUserApiKey) {
        console.log(`[CRON:SCHEDULED] Skipping payment ${payment.id} — no Fortis credentials`);
        results.skipped++;
        results.details.push({ paymentId: payment.id, status: 'skipped', reason: 'No Fortis credentials' });
        continue;
      }

      if (!schedule.source?.isActive) {
        console.log(`[CRON:SCHEDULED] Skipping payment ${payment.id} — inactive payment method`);
        await markFailed(payment.id, schedule.id, 'Payment method is no longer active');
        results.failed++;
        results.details.push({ paymentId: payment.id, status: 'failed', reason: 'Inactive payment method' });
        continue;
      }

      try {
        const amountDollars = Number(payment.amount);
        const feePercentage = 0.023;
        const feeFixed = 0.30;
        const fee = calculateFee(amountDollars, feePercentage, feeFixed);
        const netAmount = amountDollars - fee;

        const transaction = await prisma.transaction.create({
          data: {
            userId: org.userId,
            donorId: schedule.customerId,
            organizationId: org.id,
            totalAmount: amountDollars,
            subTotalAmount: netAmount,
            fee,
            firstName: schedule.customer.firstName || '',
            lastName: schedule.customer.lastName || '',
            email: schedule.customer.email || '',
            source: schedule.source.sourceType === 'ach' ? 'BNK' : 'CC',
            status: 'N',
            givingSource: 'api',
          },
        });

        const fortisClient = createFortisClient(
          process.env.FORTIS_ENVIRONMENT as 'sandbox' | 'production',
          fortis.authUserId,
          fortis.authUserApiKey!
        );

        const amountInCents = dollarsToCents(amountDollars);
        const transactionC1 = `S-${transaction.id}-${Date.now()}`;

        const result = schedule.source.sourceType === 'ach'
          ? await fortisClient.processACHDebit({
              transaction_amount: amountInCents,
              token_id: schedule.source.fortisWalletId,
              transaction_c1: transactionC1,
              transaction_c2: transaction.id.toString(),
            })
          : await fortisClient.processCreditCardSale({
              transaction_amount: amountInCents,
              token_id: schedule.source.fortisWalletId,
              transaction_c1: transactionC1,
              transaction_c2: transaction.id.toString(),
            });

        if (result.status) {
          console.log(`[CRON:SCHEDULED] Payment ${payment.id} successful`);

          await prisma.$transaction([
            prisma.transaction.update({
              where: { id: transaction.id },
              data: {
                status: 'P',
                fortisTransactionId: result.transaction?.id,
                requestResponse: JSON.stringify(result),
              },
            }),
            prisma.scheduledPayment.update({
              where: { id: payment.id },
              data: {
                status: 'paid',
                transactionId: transaction.id,
                fortisTransactionId: result.transaction?.id,
                processedAt: new Date(),
              },
            }),
            prisma.paymentSchedule.update({
              where: { id: schedule.id },
              data: {
                paidAmount: { increment: amountDollars },
                paymentsCompleted: { increment: 1 },
              },
            }),
            prisma.donor.update({
              where: { id: schedule.customerId },
              data: {
                amountAcum: { increment: amountDollars },
                feeAcum: { increment: fee },
                netAcum: { increment: netAmount },
              },
            }),
          ]);

          // Check if all payments are done — mark schedule completed
          const remaining = await prisma.scheduledPayment.count({
            where: { scheduleId: schedule.id, status: 'pending' },
          });
          if (remaining === 0) {
            await prisma.paymentSchedule.update({
              where: { id: schedule.id },
              data: { status: 'completed' },
            });
            console.log(`[CRON:SCHEDULED] Schedule ${schedule.id} completed — all payments processed`);
          }

          results.successful++;
          results.details.push({ paymentId: payment.id, status: 'success', transactionId: Number(transaction.id) });
        } else {
          console.log(`[CRON:SCHEDULED] Payment ${payment.id} FAILED:`, result.message);

          await prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: 'N', requestResponse: JSON.stringify(result) },
          });

          await markFailed(payment.id, schedule.id, result.message || 'Payment declined');

          results.failed++;
          results.details.push({ paymentId: payment.id, status: 'failed', error: result.message });
        }
      } catch (err) {
        console.error(`[CRON:SCHEDULED] Payment ${payment.id} error:`, err);
        await markFailed(payment.id, schedule.id, (err as Error).message);
        results.failed++;
        results.details.push({ paymentId: payment.id, status: 'error', error: (err as Error).message });
      }
    }

    console.log('[CRON:SCHEDULED] Done:', JSON.stringify(results));
    return NextResponse.json({ status: 'completed', results });
  } catch (error) {
    console.error('[CRON:SCHEDULED] Fatal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function markFailed(paymentId: number, scheduleId: number, errorMessage: string) {
  await prisma.$transaction([
    prisma.scheduledPayment.update({
      where: { id: paymentId },
      data: { status: 'failed', errorMessage, processedAt: new Date() },
    }),
    prisma.paymentSchedule.update({
      where: { id: scheduleId },
      data: { paymentsFailed: { increment: 1 } },
    }),
  ]);
}
