import { NextResponse, after } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FortisWebhookPayload } from '@/types/fortis';
import { logWebhookReceived, logPaymentStatusUpdated } from '@/lib/payment-logger';
import { notifyAgencyOfStatusChange } from '@/lib/agency-webhook';
import { PROVISIONING_CLAIM_PREFIX } from '@/lib/fortis/onboarding-sync';
import { reconcileAchTransactionById } from '@/lib/fortis/ach-settlement';
import { achSettlementDeps } from '@/lib/fortis/ach-settlement-runtime';
import { transactionPostbackRecord } from '@/lib/fortis/webhook-body';

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

  // Fortis transaction postback (a POST /v1/webhooks/transaction config):
  // { type, resource: 'transaction', data: { id, status_code, ... } }
  const postbackRecord = transactionPostbackRecord(body);
  if (postbackRecord) {
    return handleTransactionStatusWebhook(postbackRecord, { postback: true });
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

    // Deferred rather than dropped: delivery retries with backoff, so the
    // promise has to outlive this response instead of being cut short by it.
    after(() =>
      notifyAgencyOfStatusChange(organization.userId, organizationId, 'DENIED', previousStatus)
    );

    return NextResponse.json({ status: true, message: 'Merchant declined status recorded' });
  }

  // --- PENDED ---
  if (responseCode === 'pended') {
    console.log('[Fortis Webhook] Merchant PENDED for org:', organizationId);
    // A late "pended" must never pull a live (or declined) merchant back.
    await prisma.fortisOnboarding.updateMany({
      where: { id: organization.fortisOnboarding.id, appStatus: { notIn: ['ACTIVE', 'DENIED'] } },
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

    // Guard against duplicate processing — and against overwriting credentials
    // the reconciliation minted itself (lib/fortis/onboarding-sync.ts): once we
    // rotate the key, the one in a late webhook is dead, so an ACTIVE record is
    // never touched by a webhook.
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

    // A real key already on file was minted by the reconciliation AFTER this
    // webhook's key was issued — which invalidated the webhook's key. Never
    // replace a stored key with the webhook's; take the location/products and
    // ACTIVE from the webhook and keep our credentials. The write is
    // conditional so a mint landing between our read and this write is also
    // safe: it only replaces the key when the column still holds nothing, an
    // in-flight claim, or this very key.
    const details = {
      locationId,
      productTransactionId,
      achProductTransactionId,
      processorResponse: JSON.stringify(rawBody),
      updatedAt: new Date(),
    };

    // A claim token means the reconciliation is minting a key right now (or
    // died trying, in which case it re-mints within minutes). Either way the
    // key in this webhook may already be dead, so do not store it and do not
    // activate: record the location/products and let provisioning finish.
    const storedKey = organization.fortisOnboarding.authUserApiKey;
    if (storedKey && storedKey.startsWith(PROVISIONING_CLAIM_PREFIX)) {
      await prisma.fortisOnboarding.updateMany({
        where: { id: organization.fortisOnboarding.id, appStatus: { notIn: ['ACTIVE', 'DENIED'] } },
        data: details,
      });
      console.warn(`[Fortis Webhook] Org ${organizationId}: key mint in progress; recorded location/products, left activation to the reconciliation`);
      return NextResponse.json({ status: true, message: 'Provisioning in progress; webhook details recorded' });
    }

    // Flip to ACTIVE with the webhook's credentials only while the row is
    // still open and the key column holds nothing, this very key, or a key
    // that belongs to some other (replaced) user. Never over a claim token.
    let flipped = await prisma.fortisOnboarding.updateMany({
      where: {
        id: organization.fortisOnboarding.id,
        appStatus: { notIn: ['ACTIVE', 'DENIED'] },
        NOT: { authUserApiKey: { startsWith: PROVISIONING_CLAIM_PREFIX } },
        OR: [
          { authUserApiKey: null },
          { authUserApiKey: merchantUser.user_api_key },
          { authUserId: { not: merchantUser.user_id } },
        ],
      },
      data: { ...details, appStatus: 'ACTIVE', authUserId: merchantUser.user_id, authUserApiKey: merchantUser.user_api_key },
    });
    if (flipped.count === 0) {
      // A newer key for this same user was minted by LunarPay meanwhile: keep
      // it, activate around it. Still never over a claim token.
      flipped = await prisma.fortisOnboarding.updateMany({
        where: {
          id: organization.fortisOnboarding.id,
          appStatus: { notIn: ['ACTIVE', 'DENIED'] },
          NOT: { authUserApiKey: { startsWith: PROVISIONING_CLAIM_PREFIX } },
        },
        data: { ...details, appStatus: 'ACTIVE' },
      });
      if (flipped.count > 0) {
        console.warn(`[Fortis Webhook] Org ${organizationId} already holds a key minted by LunarPay; kept it and activated around it`);
      }
    }
    if (flipped.count === 0) {
      const fresh = await prisma.fortisOnboarding.findUnique({
        where: { id: organization.fortisOnboarding.id },
        select: { appStatus: true },
      });
      if (fresh && fresh.appStatus !== 'ACTIVE' && fresh.appStatus !== 'DENIED') {
        // A claim landed between our read and our write: record details only.
        await prisma.fortisOnboarding.updateMany({
          where: { id: organization.fortisOnboarding.id, appStatus: { notIn: ['ACTIVE', 'DENIED'] } },
          data: details,
        });
        console.warn(`[Fortis Webhook] Org ${organizationId}: key mint in progress; recorded location/products, left activation to the reconciliation`);
        return NextResponse.json({ status: true, message: 'Provisioning in progress; webhook details recorded' });
      }
      // Became ACTIVE or DENIED while this webhook was in flight: nothing to do.
      console.log('[Fortis Webhook] Merchant already terminal for org:', organizationId, '- skipping');
      return NextResponse.json({ status: true, message: 'Merchant already finalized, no changes made' });
    }

    if (!locationId) {
      console.warn('[Fortis Webhook] WARNING: location_id not found in webhook for org:', organizationId);
    }

    console.log('[Fortis Webhook] Org', organizationId, 'updated to ACTIVE');

    // The approval signal agencies depend on — deferred so the retry backoff
    // survives this response rather than dying with it.
    after(() =>
      notifyAgencyOfStatusChange(organization.userId, organizationId, 'ACTIVE', previousStatus)
    );

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
 *
 * `postback` marks Fortis's form-encoded postback format, which used to fail
 * to parse at all. Those are acted on for ACH only; a card postback is
 * acknowledged and ignored, so the card branch below stays reachable exactly
 * as it was (top-level JSON only) — it would read a refund or void as a failure.
 */
async function handleTransactionStatusWebhook(body: any, opts: { postback?: boolean } = {}) {
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

  // ACH: the codes below are card codes — an ACH debit's own progress
  // (131–133) and settlement (134) are not 101, and used to be recorded as
  // failures. The postback only says WHICH transaction to look at: its state is
  // re-read from Fortis with the merchant's own credentials and applied by the
  // same mapping and conditional write as the reconcile cron, which also sends
  // charge.succeeded / charge.failed. So the webhook and the cron can't
  // disagree or both announce one transition, and an unsigned or forged post
  // can at most trigger a re-check.
  if (transaction.source === 'BNK') {
    const result = await reconcileAchTransactionById(achSettlementDeps(), transaction.id, 'webhook');
    return NextResponse.json({
      status: true,
      message: `ACH transaction ${result ? result.outcome : 'not tracked'}`,
    });
  }

  if (opts.postback) {
    return NextResponse.json({ status: true, message: 'Card transaction postback acknowledged; not processed' });
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
