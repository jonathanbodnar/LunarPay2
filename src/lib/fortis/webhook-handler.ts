import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FortisWebhookPayload } from '@/types/fortis';
import { logWebhookReceived, logPaymentStatusUpdated } from '@/lib/payment-logger';
import { notifyAgencyOfStatusChange } from '@/lib/agency-webhook';

/**
 * Route an incoming Fortis webhook to the correct handler.
 * Supports both top-level and nested (data:{...}) payload formats.
 */
export async function routeWebhook(body: any) {
  // Fortis may nest payload under "data" key
  const webhookData = body.data || body;

  // Merge top-level fields (stage, status) into the nested data
  const mergedPayload: FortisWebhookPayload = body.data
    ? {
        ...webhookData,
        stage: body.stage || webhookData.stage,
        status: body.status || webhookData.status,
        product_transactions: webhookData.product_transactions || body.product_transactions,
      }
    : webhookData;

  // Merchant onboarding webhook: has client_app_id
  if ('client_app_id' in mergedPayload && mergedPayload.client_app_id) {
    return handleMerchantOnboardingWebhook(mergedPayload, body);
  }

  // Transaction status webhook
  if ('transaction_id' in body || 'id' in body) {
    return handleTransactionStatusWebhook(body);
  }

  await logWebhookReceived('unknown', undefined, body);
  return NextResponse.json({ status: true, message: 'Webhook received (unknown type)' });
}

/**
 * Handle a merchant onboarding webhook from Fortis.
 *
 * Matches the old PHP logic from Fortiswebhooks::merchant_account_status_listener:
 * 1. Extracts users[0].user_id, users[0].user_api_key
 * 2. Extracts location_id from the top-level field
 * 3. Iterates top-level product_transactions[] by payment_method to find CC and ACH IDs
 * 4. Falls back to locations[].product_transactions[] if top-level array is missing
 * 5. Handles approved, pended, and declined statuses
 */
async function handleMerchantOnboardingWebhook(payload: FortisWebhookPayload, rawBody: any) {
  const {
    client_app_id,
    stage,
    users,
    locations,
    location_id: topLevelLocationId,
    product_transactions: topLevelProductTransactions,
    product_transaction_id: topLevelProductTxId,
    status: webhookStatus,
  } = payload;

  const organizationId = parseInt(client_app_id);

  console.log('[Fortis Webhook] Onboarding webhook received:', {
    client_app_id,
    stage,
    hasUsers: !!users?.length,
    hasLocations: !!locations?.length,
    hasProductTransactions: !!topLevelProductTransactions?.length,
    topLevelLocationId,
    responseCode: webhookStatus?.response_code,
  });

  await logWebhookReceived('merchant_onboarding', organizationId);

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: { fortisOnboarding: true },
  });

  if (!organization) {
    console.error('[Fortis Webhook] Organization not found:', organizationId);
    return NextResponse.json({ status: false, message: 'Organization not found' }, { status: 404 });
  }

  if (!organization.fortisOnboarding) {
    console.error('[Fortis Webhook] Onboarding record not found for org:', organizationId);
    return NextResponse.json({ status: false, message: 'Onboarding record not found' }, { status: 404 });
  }

  const previousStatus = organization.fortisOnboarding.appStatus;

  // Determine webhook intent from status.response_code
  const responseCode = webhookStatus?.response_code?.toLowerCase();

  // --- DECLINED ---
  if (responseCode === 'declined' || responseCode === 'closed') {
    console.log('[Fortis Webhook] Merchant DECLINED for org:', organizationId);
    await prisma.fortisOnboarding.update({
      where: { id: organization.fortisOnboarding.id },
      data: {
        appStatus: 'DENIED',
        processorResponse: JSON.stringify(rawBody),
        updatedAt: new Date(),
      },
    });

    notifyAgencyOfStatusChange(organization.userId, organizationId, 'DENIED', previousStatus).catch(() => {});

    return NextResponse.json({ status: true, message: 'Merchant declined status recorded' });
  }

  // --- PENDED ---
  if (responseCode === 'pended') {
    console.log('[Fortis Webhook] Merchant PENDED for org:', organizationId);
    await prisma.fortisOnboarding.update({
      where: { id: organization.fortisOnboarding.id },
      data: {
        appStatus: 'PENDING_REVIEW',
        processorResponse: JSON.stringify(rawBody),
        updatedAt: new Date(),
      },
    });
    return NextResponse.json({ status: true, message: 'Merchant pended status recorded' });
  }

  // --- APPROVED (has user credentials) ---
  if (users && users.length > 0) {
    const merchantUser = users[0];

    // Guard against duplicate processing
    if (previousStatus === 'ACTIVE') {
      console.log('[Fortis Webhook] Merchant already ACTIVE for org:', organizationId, '- skipping');
      return NextResponse.json({ status: true, message: 'Merchant already active, no changes made' });
    }

    // Extract location_id (priority: top-level > user > user.locations > locations[])
    let locationId: string | null = topLevelLocationId || null;

    if (!locationId && merchantUser.location_id) {
      locationId = merchantUser.location_id;
    }
    if (!locationId && merchantUser.locations?.length) {
      locationId = merchantUser.locations[0].id;
    }
    if (!locationId && locations?.length) {
      locationId = locations[0].id;
    }

    // Extract product_transaction_ids by payment_method
    // Priority 1: Top-level product_transactions array (Fortis classic / EpicPay format)
    let ccProductTransactionId: string | null = null;
    let achProductTransactionId: string | null = null;

    if (topLevelProductTransactions?.length) {
      for (const pt of topLevelProductTransactions) {
        switch (pt.payment_method?.toLowerCase()) {
          case 'cc':
            ccProductTransactionId = pt.id;
            break;
          case 'ach':
            achProductTransactionId = pt.id;
            break;
        }
      }
    }

    // Priority 2: locations[].product_transactions (Fortis v1+ format)
    if (!ccProductTransactionId && !achProductTransactionId && locations?.length) {
      for (const loc of locations) {
        if (loc.product_transactions?.length) {
          for (const pt of loc.product_transactions) {
            switch (pt.payment_method?.toLowerCase()) {
              case 'cc':
                if (!ccProductTransactionId) ccProductTransactionId = pt.id;
                break;
              case 'ach':
                if (!achProductTransactionId) achProductTransactionId = pt.id;
                break;
            }
          }
        }
      }
    }

    // Priority 3: singular top-level fallback
    if (!ccProductTransactionId && topLevelProductTxId) {
      ccProductTransactionId = topLevelProductTxId;
    }

    // Store CC and ACH product_transaction_ids separately so we can route
    // intentions/charges to the correct product on the merchant's Fortis account.
    const productTransactionId = ccProductTransactionId || achProductTransactionId || null;

    console.log('[Fortis Webhook] Extracted credentials:', {
      userId: merchantUser.user_id,
      apiKey: merchantUser.user_api_key ? '***' + merchantUser.user_api_key.slice(-4) : null,
      locationId,
      ccProductTransactionId,
      achProductTransactionId,
    });

    await prisma.fortisOnboarding.update({
      where: { id: organization.fortisOnboarding.id },
      data: {
        authUserId: merchantUser.user_id,
        authUserApiKey: merchantUser.user_api_key,
        locationId,
        productTransactionId,
        achProductTransactionId,
        appStatus: 'ACTIVE',
        processorResponse: JSON.stringify(rawBody),
        updatedAt: new Date(),
      },
    });

    if (!locationId) {
      console.warn('[Fortis Webhook] WARNING: location_id not found in webhook for org:', organizationId);
    }

    console.log('[Fortis Webhook] Org', organizationId, 'updated to ACTIVE');

    notifyAgencyOfStatusChange(organization.userId, organizationId, 'ACTIVE', previousStatus).catch(() => {});

    return NextResponse.json({
      status: true,
      message: 'Merchant credentials updated successfully',
      locationId: locationId || 'not_found',
    });
  }

  // No users and no explicit status code — store for reference
  console.log('[Fortis Webhook] No users and no recognized status in webhook for org:', organizationId);
  await prisma.fortisOnboarding.update({
    where: { id: organization.fortisOnboarding.id },
    data: {
      processorResponse: JSON.stringify(rawBody),
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ status: true, message: 'Webhook received, no actionable data' });
}

/**
 * Handle a transaction status webhook from Fortis.
 */
async function handleTransactionStatusWebhook(body: any) {
  const fortisTransactionId = body.transaction_id || body.id;
  const statusCode = body.status_code;
  const reasonCode = body.reason_code_id;

  await logWebhookReceived('transaction_status', undefined, {
    fortis_transaction_id: fortisTransactionId,
    status_code: statusCode,
    reason_code: reasonCode,
  });

  const transaction = await prisma.transaction.findFirst({
    where: { fortisTransactionId: fortisTransactionId.toString() },
    include: { donor: true },
  });

  if (!transaction) {
    console.warn(`[Fortis Webhook] Transaction not found for Fortis ID: ${fortisTransactionId}`);
    return NextResponse.json({ status: true, message: 'Webhook received but transaction not found' });
  }

  let newStatus: 'P' | 'N' = transaction.status as 'P' | 'N';
  let statusAch: 'W' | 'P' | 'F' | null = transaction.statusAch as 'W' | 'P' | 'F' | null;

  if (statusCode === 101 && reasonCode === 1000) {
    newStatus = 'P';
    if (transaction.source === 'BNK') statusAch = 'P';
  } else if (statusCode !== 101 || reasonCode !== 1000) {
    newStatus = 'N';
    if (transaction.source === 'BNK') statusAch = 'F';
  }

  if (newStatus !== transaction.status || statusAch !== transaction.statusAch) {
    const oldStatus = transaction.status;

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: newStatus,
        statusAch,
        requestResponse: JSON.stringify(body),
        updatedAt: new Date(),
      },
    });

    if (oldStatus === 'N' && newStatus === 'P' && transaction.donorId && transaction.donor) {
      await prisma.donor.update({
        where: { id: transaction.donorId },
        data: {
          amountAcum: { increment: Number(transaction.totalAmount) },
          feeAcum: { increment: Number(transaction.fee) },
          netAcum: { increment: Number(transaction.subTotalAmount) },
          firstDate: transaction.donor.firstDate || new Date(),
        },
      });
    }

    await logPaymentStatusUpdated(
      fortisTransactionId.toString(),
      oldStatus,
      newStatus,
      transaction.id,
      { status_code: statusCode, reason_code: reasonCode, source: transaction.source }
    );
  }

  return NextResponse.json({ status: true, message: 'Transaction status webhook processed' });
}
