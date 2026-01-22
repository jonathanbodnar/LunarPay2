import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createFortisClient } from '@/lib/fortis/client';
import { dollarsToCents, calculateFee } from '@/lib/utils';
import { sendSubscriptionRecurringPaymentReceipt } from '@/lib/email';

/**
 * Cron job to process recurring subscriptions
 * Should be called daily via Railway Cron or external cron service
 * 
 * Configure in Railway Dashboard:
 * - Service Settings > Cron Jobs > Add Job
 * - Schedule: "0 2 * * *" (2 AM UTC daily)
 * - Command: curl -X POST https://lunarpay2-development.up.railway.app/api/cron/process-subscriptions
 * 
 * Or use an external cron service like cron-job.org, Vercel Cron, etc.
 */

// Allow both GET (for easier testing/external cron) and POST
export async function GET(request: Request) {
  return processSubscriptions(request);
}

export async function POST(request: Request) {
  return processSubscriptions(request);
}

async function processSubscriptions(request: Request) {
  console.log('[CRON] Process subscriptions started at:', new Date().toISOString());
  
  try {
    // Verify cron secret for security (optional - skip if not set)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Also check for Vercel cron header
    const vercelCronHeader = request.headers.get('x-vercel-cron');
    
    // Check for admin trigger (query param with admin secret)
    const url = new URL(request.url);
    const adminTrigger = url.searchParams.get('admin_key');
    const isAdminTrigger = adminTrigger === process.env.ADMIN_PASSWORD; // Use existing admin password
    
    if (cronSecret && !vercelCronHeader && !isAdminTrigger && authHeader !== `Bearer ${cronSecret}`) {
      console.log('[CRON] Unauthorized attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();
    // Set to end of today to catch all due subscriptions
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    console.log('[CRON] Looking for subscriptions due on or before:', endOfToday.toISOString());

    // Get all active subscriptions due today or earlier
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'A',
        nextPaymentOn: {
          lte: endOfToday,
        },
      },
      include: {
        donor: true,
        organization: true,
      },
    });

    console.log('[CRON] Found', subscriptions.length, 'subscriptions to process');

    const results = {
      total: subscriptions.length,
      successful: 0,
      failed: 0,
      skipped: 0,
      details: [] as any[],
    };

    for (const subscription of subscriptions) {
      console.log(`[CRON] Processing subscription ${subscription.id} for ${subscription.email}`);
      
      try {
        // Get organization with Fortis credentials
        const organization = await prisma.organization.findFirst({
          where: { id: subscription.organizationId },
          include: {
            fortisOnboarding: true,
          },
        });

        if (!organization?.fortisOnboarding?.authUserId) {
          console.log(`[CRON] Skipping subscription ${subscription.id} - no Fortis credentials`);
          results.skipped++;
          results.details.push({
            subscriptionId: subscription.id,
            status: 'skipped',
            reason: 'No Fortis credentials',
          });
          continue;
        }

        // Get payment source (saved card/bank)
        const source = await prisma.source.findFirst({
          where: {
            id: subscription.sourceId,
            isActive: true,
          },
        });

        if (!source) {
          console.log(`[CRON] Skipping subscription ${subscription.id} - no active payment source`);
          results.skipped++;
          results.details.push({
            subscriptionId: subscription.id,
            status: 'skipped',
            reason: 'No active payment source',
          });
          continue;
        }
        
        console.log(`[CRON] Processing $${subscription.amount} charge for subscription ${subscription.id}`);

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
          console.log(`[CRON] Subscription ${subscription.id} payment successful, transaction ${transaction.id}`);
          
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
          let nextPaymentDate = new Date(subscription.nextPaymentOn!);
          switch (subscription.frequency) {
            case 'weekly':
            case 'W':
              nextPaymentDate.setDate(nextPaymentDate.getDate() + 7);
              break;
            case 'monthly':
            case 'M':
              nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
              break;
            case 'quarterly':
            case 'Q':
              nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 3);
              break;
            case 'yearly':
            case 'Y':
              nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + 1);
              break;
            default:
              // Default to monthly
              nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
          }

          console.log(`[CRON] Subscription ${subscription.id} next payment: ${nextPaymentDate.toISOString()}`);

          // Update subscription
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              nextPaymentOn: nextPaymentDate,
              lastPaymentOn: new Date(),
              successTrxns: { increment: 1 },
            },
          });

          // Send receipt email
          try {
            await sendSubscriptionRecurringPaymentReceipt({
              customerName: `${subscription.firstName} ${subscription.lastName}`,
              customerEmail: subscription.email,
              amount: Number(subscription.amount),
              fee: subscription.isFeeCovered ? fee : 0,
              organizationName: organization.name,
              frequency: subscription.frequency,
              nextPaymentDate: nextPaymentDate.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }),
              transactionId: transaction.id.toString(),
            });
            console.log(`[CRON] Receipt email sent for subscription ${subscription.id}`);
          } catch (emailError) {
            console.error(`[CRON] Failed to send receipt email for subscription ${subscription.id}:`, emailError);
          }

          results.successful++;
          results.details.push({
            subscriptionId: subscription.id,
            status: 'success',
            transactionId: Number(transaction.id),
            amount: Number(subscription.amount),
            nextPayment: nextPaymentDate.toISOString(),
          });
        } else {
          console.log(`[CRON] Subscription ${subscription.id} payment FAILED:`, result.message);
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

