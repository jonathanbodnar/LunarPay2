import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FortisWebhookPayload } from '@/types/fortis';
import { logWebhookReceived, logPaymentStatusUpdated } from '@/lib/payment-logger';

/**
 * Fortis Webhook Handler
 * Receives merchant account status updates and payment status updates from Fortis
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
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
    fullPayload: JSON.stringify(body, null, 2),
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
    return NextResponse.json(
      { status: false, message: 'Organization not found' },
      { status: 404 }
    );
  }

  if (!organization.fortisOnboarding) {
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
        processorResponse: JSON.stringify(body), // Store full webhook for debugging
        updatedAt: new Date(),
      },
    });

    // Log if location_id was not found (will need manual resolution)
    if (!locationId) {
      console.warn('[Fortis Webhook] WARNING: location_id not found in webhook for org:', organizationId);
      console.warn('[Fortis Webhook] Full payload:', JSON.stringify(body, null, 2));
    }

    // TODO: Send email notification to merchant
    // "Your account is ready for receiving payments!"

    return NextResponse.json({
      status: true,
      message: 'Merchant onboarding webhook processed successfully',
      locationId: locationId || 'not_found',
    });
  }

  return NextResponse.json(
    { status: false, message: 'No user credentials provided' },
    { status: 400 }
  );
}

/**
 * Handle transaction status update webhook
 */
async function handleTransactionStatusWebhook(body: any) {
  const fortisTransactionId = body.transaction_id || body.id;
  const statusCode = body.status_code;
  const reasonCode = body.reason_code_id;
  const status = body.status;

  await logWebhookReceived('transaction_status', undefined, {
    fortis_transaction_id: fortisTransactionId,
    status_code: statusCode,
    reason_code: reasonCode,
  });

  // Find transaction by Fortis transaction ID
  const transaction = await prisma.transaction.findFirst({
    where: {
      fortisTransactionId: fortisTransactionId.toString(),
    },
    include: {
      donor: true,
    },
  });

  if (!transaction) {
    // Transaction not found - might be from another system or not yet created
    console.warn(`Transaction not found for Fortis ID: ${fortisTransactionId}`);
    return NextResponse.json({
      status: true,
      message: 'Webhook received but transaction not found',
    });
  }

  // Determine new status based on Fortis response
  let newStatus: 'P' | 'N' = transaction.status as 'P' | 'N';
  let statusAch: 'W' | 'P' | 'F' | null = transaction.statusAch as 'W' | 'P' | 'F' | null;

  // Status code 101 = Success, reason_code 1000 = Approved/Accepted
  if (statusCode === 101 && reasonCode === 1000) {
    newStatus = 'P';
    if (transaction.source === 'BNK') {
      statusAch = 'P'; // ACH processed
    }
  } else if (statusCode !== 101 || reasonCode !== 1000) {
    // Failed or declined
    newStatus = 'N';
    if (transaction.source === 'BNK') {
      statusAch = 'F'; // ACH failed
    }
  }

  // Only update if status changed
  if (newStatus !== transaction.status || statusAch !== transaction.statusAch) {
    const oldStatus = transaction.status;
    
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: newStatus,
        statusAch: statusAch,
        requestResponse: JSON.stringify(body),
        updatedAt: new Date(),
      },
    });

    // Update donor totals if status changed from failed to succeeded
    if (oldStatus === 'N' && newStatus === 'P' && transaction.donorId && transaction.donor) {
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

    // Log the status update
    await logPaymentStatusUpdated(
      fortisTransactionId.toString(),
      oldStatus,
      newStatus,
      transaction.id,
      {
        status_code: statusCode,
        reason_code: reasonCode,
        source: transaction.source,
      }
    );
  }

  return NextResponse.json({
    status: true,
    message: 'Transaction status webhook processed successfully',
  });
}

