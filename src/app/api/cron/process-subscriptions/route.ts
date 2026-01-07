import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createFortisClient } from '@/lib/fortis/client';
import { dollarsToCents, calculateFee } from '@/lib/utils';

/**
 * Cron job to process recurring subscriptions
 * Should be called daily via Railway Cron or Vercel Cron
 * 
 * Railway Cron Config:
 * Schedule: "0 2 * * *" (2 AM daily)
 * Command: curl https://yourapp.railway.app/api/cron/process-subscriptions
 */
export async function POST(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all active subscriptions due today
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'A',
        nextPaymentOn: {
          lte: today,
        },
      },
      include: {
        donor: true,
      },
    });

    const results = {
      total: subscriptions.length,
      successful: 0,
      failed: 0,
      details: [] as any[],
    };

    for (const subscription of subscriptions) {
      try {
        // Get organization and Fortis credentials
        const organization = await prisma.organization.findFirst({
          where: { id: subscription.organizationId },
          include: {
            fortisOnboarding: true,
          },
        });

        if (!organization?.fortisOnboarding?.authUserId) {
          results.failed++;
          continue;
        }

        // Get payment source
        const source = await prisma.source.findFirst({
          where: {
            id: subscription.sourceId,
            isActive: true,
          },
        });

        if (!source) {
          results.failed++;
          continue;
        }

        // Calculate fee
        const feePercentage = 0.023;
        const feeFixed = 0.30;
        const fee = calculateFee(Number(subscription.amount), feePercentage, feeFixed);
        const netAmount = Number(subscription.amount) - fee;

        // Create transaction record
        const transaction = await prisma.transaction.create({
          data: {
            userId: organization.userId,
            donorId: subscription.donorId,
            organizationId: subscription.organizationId,
            subOrganizationId: subscription.subOrganizationId,
            totalAmount: subscription.amount,
            subTotalAmount: netAmount,
            fee,
            firstName: subscription.firstName,
            lastName: subscription.lastName,
            email: subscription.email,
            source: subscription.source,
            status: 'N',
            transactionType: 'Donation',
            givingSource: subscription.givingSource,
            template: subscription.template,
            isFeeCovered: subscription.isFeeCovered,
            subscriptionId: subscription.id,
          },
        });

        // Get fund allocation
        const fundAllocation = await prisma.transactionFund.findFirst({
          where: { subscriptionId: subscription.id },
        });

        if (fundAllocation) {
          await prisma.transactionFund.create({
            data: {
              transactionId: transaction.id,
              fundId: fundAllocation.fundId,
              amount: subscription.amount,
              fee,
              net: netAmount,
            },
          });
        }

        // Process payment with Fortis
        const fortisClient = createFortisClient(
          process.env.FORTIS_ENVIRONMENT as 'sandbox' | 'production',
          organization.fortisOnboarding.authUserId,
          organization.fortisOnboarding.authUserApiKey!
        );

        const amountInCents = dollarsToCents(Number(subscription.amount));
        const systemLetterId = 'L';
        const transactionC1 = `${systemLetterId}-${transaction.id}-${Date.now()}`;

        // Note: client_customer_id is not allowed by Fortis API, removed from request
        const result = subscription.source === 'CC'
          ? await fortisClient.processCreditCardSale({
              transaction_amount: amountInCents,
              token_id: source.fortisWalletId,
              transaction_c1: transactionC1,
              transaction_c2: transaction.id.toString(),
            })
          : await fortisClient.processACHDebit({
              transaction_amount: amountInCents,
              token_id: source.fortisWalletId,
              transaction_c1: transactionC1,
              transaction_c2: transaction.id.toString(),
            });

        // Update transaction with result
        if (result.status) {
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              status: 'P',
              fortisTransactionId: result.transaction?.id,
              requestResponse: JSON.stringify(result),
            },
          });

          // Update donor totals
          await prisma.donor.update({
            where: { id: subscription.donorId },
            data: {
              amountAcum: { increment: Number(subscription.amount) },
              feeAcum: { increment: fee },
              netAcum: { increment: netAmount },
            },
          });

          // Calculate next payment date
          let nextPaymentDate = new Date(subscription.nextPaymentOn);
          switch (subscription.frequency) {
            case 'weekly':
              nextPaymentDate.setDate(nextPaymentDate.getDate() + 7);
              break;
            case 'monthly':
              nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
              break;
            case 'quarterly':
              nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 3);
              break;
            case 'yearly':
              nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + 1);
              break;
          }

          // Update subscription
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              nextPaymentOn: nextPaymentDate,
              lastPaymentOn: new Date(),
              successTrxns: { increment: 1 },
            },
          });

          results.successful++;
          results.details.push({
            subscriptionId: subscription.id,
            status: 'success',
            transactionId: transaction.id,
          });
        } else {
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              status: 'N',
              requestResponse: JSON.stringify(result),
            },
          });

          // Update fail count
          const failCount = (subscription.failTrxns || 0) + 1;
          const updateData: any = {
            failTrxns: { increment: 1 },
          };

          // Cancel subscription after 4 failed attempts with no previous success
          if (failCount >= 4 && (subscription.successTrxns || 0) === 0) {
            updateData.status = 'D';
            updateData.cancelledAt = new Date();
          }

          await prisma.subscription.update({
            where: { id: subscription.id },
            data: updateData,
          });

          results.failed++;
          results.details.push({
            subscriptionId: subscription.id,
            status: 'failed',
            error: result.message,
          });
        }
      } catch (error) {
        console.error(`Subscription ${subscription.id} processing error:`, error);
        results.failed++;
        results.details.push({
          subscriptionId: subscription.id,
          status: 'error',
          error: (error as Error).message,
        });
      }
    }

    return NextResponse.json({
      status: 'completed',
      results,
    });
  } catch (error) {
    console.error('Process subscriptions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

