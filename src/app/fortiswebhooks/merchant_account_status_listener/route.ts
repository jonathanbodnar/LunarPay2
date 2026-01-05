import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FortisWebhookPayload } from '@/types/fortis';
import { logWebhookReceived, logPaymentStatusUpdated } from '@/lib/payment-logger';

/**
 * Fortis Webhook Handler - Legacy URL
 * This matches the old PHP endpoint: /fortiswebhooks/merchant_account_status_listener
 * Receives merchant account status updates from Fortis
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    console.log('[Fortis Webhook - Legacy URL] Received webhook:', JSON.stringify(body, null, 2));
    
    // Log webhook to database
    await prisma.fortisWebhook.create({
      data: {
        eventJson: JSON.stringify(body),
        system: 'lunarpay',
        mode: (body as any).stage || 'unknown',
      },
    });

    // Check if this is a merchant onboarding webhook
    if ('client_app_id' in body && 'users' in body) {
      return await handleMerchantOnboardingWebhook(body as FortisWebhookPayload);
    }

    // Check if this is a transaction status webhook
    if ('transaction_id' in body || 'id' in body) {
      return await handleTransactionStatusWebhook(body);
    }

    // Unknown webhook type - log it
    await logWebhookReceived('unknown', undefined, body);
    
    return NextResponse.json({
      status: true,
      message: 'Webhook received (unknown type)',
    });
  } catch (error) {
    console.error('Fortis webhook error:', error);
    return NextResponse.json(
      { status: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle merchant onboarding webhook
 */
async function handleMerchantOnboardingWebhook(body: FortisWebhookPayload) {
  const { client_app_id, stage, users, locations, location_id: topLevelLocationId, product_transaction_id: topLevelProductTxId } = body;

  console.log('[Fortis Webhook] Merchant onboarding webhook received:', {
    client_app_id,
    stage,
    hasUsers: !!users?.length,
    hasLocations: !!locations?.length,
    topLevelLocationId,
    topLevelProductTxId,
  });

  await logWebhookReceived('merchant_onboarding', parseInt(client_app_id));

  // Find organization by client_app_id
  const organizationId = parseInt(client_app_id);
  
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      fortisOnboarding: true,
    },
  });

  if (!organization) {
    console.error('[Fortis Webhook] Organization not found:', organizationId);
    return NextResponse.json(
      { status: false, message: 'Organization not found' },
      { status: 404 }
    );
  }

  if (!organization.fortisOnboarding) {
    console.error('[Fortis Webhook] Onboarding record not found for org:', organizationId);
    return NextResponse.json(
      { status: false, message: 'Onboarding record not found' },
      { status: 404 }
    );
  }

  // Extract user credentials from webhook
  if (users && users.length > 0) {
    const merchantUser = users[0];
    
    // Extract location_id from various possible places in the webhook
    let locationId: string | null = null;
    let productTransactionId: string | null = null;
    
    // Priority 1: User's location_id
    if (merchantUser.location_id) {
      locationId = merchantUser.location_id;
    }
    
    // Priority 2: User's locations array
    if (!locationId && merchantUser.locations && merchantUser.locations.length > 0) {
      locationId = merchantUser.locations[0].id;
    }
    
    // Priority 3: Top-level location_id
    if (!locationId && topLevelLocationId) {
      locationId = topLevelLocationId;
    }
    
    // Priority 4: Top-level locations array
    if (!locationId && locations && locations.length > 0) {
      locationId = locations[0].id;
      // Also try to get product_transaction_id from location
      if (locations[0].product_transactions && locations[0].product_transactions.length > 0) {
        productTransactionId = locations[0].product_transactions[0].id;
      }
    }
    
    // Get product_transaction_id
    if (!productTransactionId && topLevelProductTxId) {
      productTransactionId = topLevelProductTxId;
    }
    
    console.log('[Fortis Webhook] Extracted credentials:', {
      userId: merchantUser.user_id,
      userApiKey: merchantUser.user_api_key ? '***' + merchantUser.user_api_key.slice(-4) : null,
      locationId,
      productTransactionId,
    });

    // Update onboarding record with merchant credentials
    await prisma.fortisOnboarding.update({
      where: { id: organization.fortisOnboarding.id },
      data: {
        authUserId: merchantUser.user_id,
        authUserApiKey: merchantUser.user_api_key,
        locationId: locationId,
        productTransactionId: productTransactionId,
        appStatus: 'ACTIVE',
        processorResponse: JSON.stringify(body),
        updatedAt: new Date(),
      },
    });

    // Log if location_id was not found
    if (!locationId) {
      console.warn('[Fortis Webhook] WARNING: location_id not found in webhook for org:', organizationId);
    }

    console.log('[Fortis Webhook] Successfully updated org', organizationId, 'to ACTIVE status');

    return NextResponse.json({
      status: true,
      message: 'Merchant credentials updated successfully',
    });
  }

  // No users in webhook - just log it
  console.log('[Fortis Webhook] No users in webhook, storing for reference');
  
  await prisma.fortisOnboarding.update({
    where: { id: organization.fortisOnboarding.id },
    data: {
      processorResponse: JSON.stringify(body),
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({
    status: true,
    message: 'Webhook received, no user credentials to update',
  });
}

/**
 * Handle transaction status webhook
 */
async function handleTransactionStatusWebhook(body: any) {
  const transactionId = body.transaction_id || body.id;
  const status = body.status_code || body.status;
  
  console.log('[Fortis Webhook] Transaction status webhook:', {
    transactionId,
    status,
  });

  await logWebhookReceived('transaction_status', undefined, { transactionId, status });

  // Find and update transaction
  if (transactionId) {
    const transaction = await prisma.transaction.findFirst({
      where: {
        fortisTransactionId: transactionId.toString(),
      },
      include: {
        donor: true,
      },
    });

    if (transaction) {
      const oldStatus = transaction.status;
      const newStatus = status;
      
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: newStatus,
          updatedAt: new Date(),
        },
      });

      await logPaymentStatusUpdated(
        Number(transaction.id),
        oldStatus || 'unknown',
        newStatus,
        { fortisTransactionId: transactionId }
      );

      // Update donor totals if status changed from failed to succeeded
      if (oldStatus === 'N' && newStatus === 'P' && transaction.donor) {
        const amount = Number(transaction.totalAmount);
        const fee = Number(transaction.fee);
        const netAmount = Number(transaction.subTotalAmount);

        await prisma.donor.update({
          where: { id: transaction.donorId },
          data: {
            amountAcum: { increment: amount },
            feeAcum: { increment: fee },
            netAcum: { increment: netAmount },
            firstDate: transaction.donor.firstDate || new Date(),
          },
        });
      }

      return NextResponse.json({
        status: true,
        message: 'Transaction status updated',
      });
    }
  }

  return NextResponse.json({
    status: true,
    message: 'Transaction webhook received',
  });
}

