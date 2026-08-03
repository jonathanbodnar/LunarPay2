import { NextResponse, after } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FortisWebhookPayload } from '@/types/fortis';
import { logWebhookReceived, logPaymentStatusUpdated } from '@/lib/payment-logger';
import { notifyAgencyOfStatusChange } from '@/lib/agency-webhook';
import { createFortisClient, FortisClient } from '@/lib/fortis/client';

/**
 * Whether the transport that delivered this webhook authenticated it.
 *
 * `signed`   — arrived on /api/fortis/webhooks and passed HMAC verification.
 *              The payload is from Fortis; act on it directly.
 * `unsigned` — arrived on the legacy /fortiswebhooks/... URL, which Fortis
 *              classic posts to without a signature. ANYONE can post there, so
 *              the payload is treated as an untrusted *hint* that something
 *              changed. Nothing in it is written to the database. The
 *              authoritative state is re-fetched from Fortis over an
 *              authenticated outbound call before any mutation.
 *
 * Without this distinction a forged POST could hand a merchant
 * attacker-controlled processor credentials and flip them ACTIVE, routing that
 * merchant's future card volume to the attacker's Fortis account.
 */
export type WebhookTrust = 'signed' | 'unsigned';

/**
 * One environment resolution for this whole file, matching createFortisClient.
 *
 * Three different conventions are in use across the codebase — `FORTIS_ENVIRONMENT`,
 * lowercase `fortis_environment`, and the values 'prd' / 'prod' / 'production'.
 * Resolving them inconsistently here would be silent and expensive: attestation
 * could talk to production while a follow-up lookup talks to sandbox with
 * production credentials, and simply fail.
 */
function resolveFortisEnv(): 'sandbox' | 'production' {
  const raw = process.env.FORTIS_ENVIRONMENT || process.env.fortis_environment || 'sandbox';
  return raw === 'production' || raw === 'prd' || raw === 'prod' ? 'production' : 'sandbox';
}

/**
 * Ask Fortis directly what it thinks the state of an application is. This is
 * the trust anchor for unsigned deliveries: a forger controls the request body
 * but cannot make Fortis's own API corroborate it.
 */
async function attestOnboardingWithFortis(organizationId: number): Promise<
  | { ok: true; data: NonNullable<Awaited<ReturnType<ReturnType<typeof createFortisClient>['getOnboardingStatus']>>['data']> }
  | { ok: false; reason: string }
> {
  // Two construction methods, matching /api/admin/recover-status. The platform
  // credentials are read under two different env-var conventions across this
  // codebase; if attestation could only build a client one way, a naming
  // mismatch in the deployed environment would 503 every inbound webhook and
  // silently stall all merchant approvals.
  const attempts: Array<() => FortisClient> = [
    () => createFortisClient(),
    () =>
      new FortisClient({
        developerId: process.env.FORTIS_DEVELOPER_ID || '',
        userId: process.env.FORTIS_USER_ID || '',
        userApiKey: process.env.FORTIS_USER_API_KEY || '',
        environment: resolveFortisEnv(),
      }),
  ];

  let lastReason = 'no Fortis client could be constructed';

  for (const build of attempts) {
    try {
      const result = await build().getOnboardingStatus(organizationId.toString());
      if (result.status && result.data) {
        return { ok: true, data: result.data };
      }
      lastReason = result.message || 'Fortis returned no application data';
    } catch (e) {
      lastReason = e instanceof Error ? e.message : 'Fortis status lookup threw';
    }
  }

  return { ok: false, reason: lastReason };
}

/**
 * Route an incoming Fortis webhook to the correct handler.
 * Supports both top-level and nested (data:{...}) payload formats.
 *
 * `trust` is required rather than defaulting, so a future caller has to make an
 * explicit decision instead of silently inheriting the permissive path.
 */
export async function routeWebhook(body: any, trust: WebhookTrust) {
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
    return handleMerchantOnboardingWebhook(mergedPayload, body, trust);
  }

  // Transaction status webhook
  if ('transaction_id' in body || 'id' in body) {
    return handleTransactionStatusWebhook(body, trust);
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
async function handleMerchantOnboardingWebhook(
  payload: FortisWebhookPayload,
  rawBody: any,
  trust: WebhookTrust
) {
  const {
    client_app_id,
    stage,
    users: payloadUsers,
    locations: payloadLocations,
    location_id: payloadLocationId,
    product_transactions: payloadProductTransactions,
    product_transaction_id: payloadProductTxId,
    status: webhookStatus,
  } = payload;

  const organizationId = parseInt(client_app_id);

  console.log('[Fortis Webhook] Onboarding webhook received:', {
    client_app_id,
    stage,
    trust,
    hasUsers: !!payloadUsers?.length,
    hasLocations: !!payloadLocations?.length,
    hasProductTransactions: !!payloadProductTransactions?.length,
    payloadLocationId,
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

  // ──────────────────────────────────────────────────────────────────────────
  // TRUST GATE
  //
  // On a signed delivery the payload is Fortis's own word, so it is used as-is
  // (unchanged behavior). On an unsigned delivery the payload is attacker-
  // controllable, so it is used only to learn WHICH application to look at —
  // every value that gets written comes back from Fortis over an authenticated
  // request instead.
  // ──────────────────────────────────────────────────────────────────────────
  let users = payloadUsers;
  let locations = payloadLocations;
  let topLevelLocationId = payloadLocationId;
  let topLevelProductTransactions = payloadProductTransactions;
  let topLevelProductTxId = payloadProductTxId;
  let responseCode = webhookStatus?.response_code?.toLowerCase();
  let attestedAppLink: string | null = null;
  let attestedRecord: unknown = null;

  if (trust === 'unsigned') {
    const attestation = await attestOnboardingWithFortis(organizationId);

    if (!attestation.ok) {
      // Cannot corroborate, so nothing is written. 503 asks Fortis to retry;
      // a forged request simply achieves nothing. A genuine approval that
      // stalls here is still recoverable through /api/fortis/check-status and
      // /api/admin/recover-status, neither of which trusts a payload.
      console.error(
        '[Fortis Webhook] UNSIGNED delivery could not be attested for org',
        organizationId,
        '-- refusing to mutate. Reason:',
        attestation.reason
      );
      return NextResponse.json(
        { status: false, message: 'Unable to verify webhook against Fortis; not applied' },
        { status: 503 }
      );
    }

    const fortisData = attestation.data;

    // Field names verified against a real production response (org 30):
    // location_id and product_transactions sit at the TOP LEVEL and there is no
    // `locations` array. Reading `fortisData.locations` here — as an earlier
    // revision of this gate did — resolved locationId and both product ids to
    // null, and the merchant went ACTIVE unable to take a single payment
    // because /v1/intentions rejects a merchant with no product transactions.
    users = fortisData.users as typeof payloadUsers;
    locations = fortisData.locations as typeof payloadLocations;
    topLevelLocationId = fortisData.location_id;
    topLevelProductTransactions =
      fortisData.product_transactions as typeof payloadProductTransactions;
    topLevelProductTxId = undefined;
    attestedAppLink = fortisData.app_link ?? null;
    attestedRecord = fortisData;

    if (users && users.length > 0) {
      // Fortis holds credentials for this application: it is approved.
      responseCode = 'approved';
    } else if (responseCode === 'declined' || responseCode === 'closed' || responseCode === 'pended') {
      // The application record carries no status field, so a decline or pend
      // cannot be read back from Fortis directly. The payload's classification
      // is accepted ONLY here — where Fortis has confirmed there are no
      // credentials, i.e. the merchant is not approved and cannot charge under
      // any outcome. The worst a forged request achieves is marking an
      // already-unapproved merchant as denied, which is reversible and moves no
      // money. Credentials are never taken from the payload on this path.
      console.warn(
        '[Fortis Webhook] Applying unattested outcome',
        responseCode,
        'for org',
        organizationId,
        '— Fortis confirms no credentials exist, so this cannot affect charging'
      );
    } else {
      responseCode = undefined;
    }

    console.log('[Fortis Webhook] Attested unsigned delivery for org', organizationId, {
      resolvedOutcome: responseCode ?? 'none',
      hasCredentials: !!users?.length,
      attestedLocationId: topLevelLocationId ?? null,
      attestedProductCount: topLevelProductTransactions?.length ?? 0,
      hasAppLink: !!attestedAppLink,
    });
  }

  // Opportunistically repair a missing MPA link whenever Fortis hands us one.
  // An application that came back E05 "Duplicate Client App ID" on submit has
  // no stored link and the merchant is stuck on "Application Not Ready"; this
  // heals that record the next time Fortis says anything about it.
  if (attestedAppLink && !organization.fortisOnboarding.mpaLink) {
    await prisma.fortisOnboarding.update({
      where: { id: organization.fortisOnboarding.id },
      data: { mpaLink: attestedAppLink, updatedAt: new Date() },
    });
    console.log('[Fortis Webhook] Backfilled missing mpa_link for org', organizationId);
  }

  // What gets archived on the onboarding row. For unsigned deliveries this is
  // Fortis's own record, never the caller-supplied body — otherwise an attacker
  // could write arbitrary JSON into a merchant's processor_response.
  const processorResponseJson = JSON.stringify(
    trust === 'unsigned' ? attestedRecord : rawBody
  );

  // --- DECLINED ---
  if (responseCode === 'declined' || responseCode === 'closed') {
    console.log('[Fortis Webhook] Merchant DECLINED for org:', organizationId);
    await prisma.fortisOnboarding.update({
      where: { id: organization.fortisOnboarding.id },
      data: {
        appStatus: 'DENIED',
        processorResponse: processorResponseJson,
        updatedAt: new Date(),
      },
    });

    // Only on an actual transition. The legacy endpoint is open, so without
    // this an unauthenticated caller could replay a decline for an
    // already-denied merchant and make us fire merchant.denied at the agency's
    // webhook on every request.
    if (previousStatus !== 'DENIED') {
      // Deferred rather than dropped: delivery retries with backoff, so the
      // promise has to outlive this response instead of being cut short by it.
      after(() =>
        notifyAgencyOfStatusChange(organization.userId, organizationId, 'DENIED', previousStatus)
      );
    }

    return NextResponse.json({ status: true, message: 'Merchant declined status recorded' });
  }

  // --- PENDED ---
  if (responseCode === 'pended') {
    console.log('[Fortis Webhook] Merchant PENDED for org:', organizationId);
    await prisma.fortisOnboarding.update({
      where: { id: organization.fortisOnboarding.id },
      data: {
        appStatus: 'PENDING_REVIEW',
        processorResponse: processorResponseJson,
        updatedAt: new Date(),
      },
    });

    // This transition used to be completely silent, leaving the agency with no
    // signal at all between "application submitted" and a final decision. In
    // practice Fortis pends an application once the merchant has finished
    // signing, so this is the earliest confirmation an agency can get that the
    // merchant did their part. Only on an actual transition, so a redelivered
    // webhook doesn't re-notify.
    if (previousStatus !== 'PENDING_REVIEW') {
      after(() =>
        notifyAgencyOfStatusChange(
          organization.userId,
          organizationId,
          'PENDING_REVIEW',
          previousStatus
        )
      );
    }

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

    // Priority 4: ask Fortis for the location's products directly.
    //
    // Needed because the attested (unsigned) path deliberately discards the
    // caller's product_transactions array, and Fortis's application record does
    // not always carry payment_method on the nested products. Landing here with
    // both ids null would store none, and /v1/intentions would then reject the
    // merchant with "Credit card processing is not enabled" — a live merchant
    // unable to charge. This closes that gap for both trust paths.
    if (!ccProductTransactionId && !achProductTransactionId && locationId && merchantUser.user_api_key) {
      try {
        const merchantClient = createFortisClient(
          resolveFortisEnv(),
          merchantUser.user_id,
          merchantUser.user_api_key
        );
        const loc = await merchantClient.getLocation(locationId, {
          expand: ['product_transactions'],
        });
        for (const pt of loc.location?.product_transactions ?? []) {
          const method = pt.payment_method?.toLowerCase();
          if (method === 'cc' && !ccProductTransactionId) ccProductTransactionId = pt.id;
          if (method === 'ach' && !achProductTransactionId) achProductTransactionId = pt.id;
        }
        console.log('[Fortis Webhook] Resolved product transactions from location lookup:', {
          ccProductTransactionId,
          achProductTransactionId,
        });
      } catch (e) {
        console.error('[Fortis Webhook] Location product lookup failed for org', organizationId, e);
      }
    }

    // Store CC and ACH product_transaction_ids separately so we can route
    // intentions/charges to the correct product on the merchant's Fortis account.
    // Never downgrade a value we already hold to null — a later webhook that
    // omits the products must not disable a merchant's card processing.
    const existing = organization.fortisOnboarding;

    // product_transaction_id is the CARD binding specifically — api-auth hands
    // it back as fortisCcProductTransactionId and /v1/intentions sends it as
    // { type: 'cc', product_transaction_id }. Falling back to the ACH id here
    // would bind an ACH product to a card intention on an ACH-only merchant.
    const productTransactionId = ccProductTransactionId || existing.productTransactionId || null;
    const resolvedAchProductTransactionId =
      achProductTransactionId || existing.achProductTransactionId || null;

    // Refuse to activate a merchant we cannot actually route a payment for.
    //
    // Flipping appStatus to ACTIVE satisfies api-auth, which checks only that
    // field — but /v1/intentions rejects every checkout with 503 when there is
    // no location or no product binding. That combination is the worst failure
    // shape available: the merchant and the agency both see a successful
    // approval while every payment attempt dies. Both axes are checked, not
    // just the location; 503 lets Fortis retry into a run that can resolve them,
    // and check-status / recover-status can repair it by hand.
    const haveLocation = !!(locationId || existing.locationId);
    const haveProduct = !!(
      productTransactionId ||
      resolvedAchProductTransactionId
    );

    if (!haveLocation || !haveProduct) {
      console.error(
        '[Fortis Webhook] Refusing to activate org',
        organizationId,
        '— incomplete routing data.',
        { haveLocation, haveProduct }
      );
      return NextResponse.json(
        {
          status: false,
          message: 'Cannot activate merchant without a location_id and at least one product transaction',
        },
        { status: 503 }
      );
    }

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
        locationId: locationId ?? existing.locationId,
        productTransactionId,
        achProductTransactionId: resolvedAchProductTransactionId,
        appStatus: 'ACTIVE',
        processorResponse: processorResponseJson,
        updatedAt: new Date(),
      },
    });

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
      processorResponse: processorResponseJson,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ status: true, message: 'Webhook received, no actionable data' });
}

/**
 * Handle a transaction status webhook from Fortis.
 */
async function handleTransactionStatusWebhook(body: any, trust: WebhookTrust) {
  const fortisTransactionId = body.transaction_id || body.id;
  let statusCode = body.status_code;
  let reasonCode = body.reason_code_id;

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

  // Same trust gate as onboarding: on the unsigned endpoint the status and
  // reason codes are attacker-controllable, and flipping a transaction to 'P'
  // credits the donor's lifetime totals. Re-read the real codes from Fortis
  // using the owning merchant's credentials before believing anything.
  if (trust === 'unsigned') {
    const onboarding = await prisma.fortisOnboarding.findUnique({
      where: { organizationId: transaction.organizationId },
      select: { authUserId: true, authUserApiKey: true },
    });

    if (!onboarding?.authUserId || !onboarding?.authUserApiKey) {
      console.error(
        '[Fortis Webhook] UNSIGNED transaction webhook for org',
        transaction.organizationId,
        'has no merchant credentials to verify against -- not applied'
      );
      return NextResponse.json(
        { status: false, message: 'Unable to verify webhook against Fortis; not applied' },
        { status: 503 }
      );
    }

    let verified;
    try {
      const client = createFortisClient(
        resolveFortisEnv(),
        onboarding.authUserId,
        onboarding.authUserApiKey
      );
      verified = await client.getTransaction(fortisTransactionId.toString());
    } catch (e) {
      verified = { status: false, message: e instanceof Error ? e.message : 'lookup threw' };
    }

    if (!verified.status || !verified.transaction) {
      console.error(
        '[Fortis Webhook] UNSIGNED transaction webhook could not be attested for',
        fortisTransactionId,
        '-- not applied. Reason:',
        verified.message
      );
      return NextResponse.json(
        { status: false, message: 'Unable to verify webhook against Fortis; not applied' },
        { status: 503 }
      );
    }

    // Fortis's codes win outright — the body is only a nudge to go look.
    statusCode = verified.transaction.status_code;
    reasonCode = verified.transaction.reason_code_id;
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
        requestResponse: JSON.stringify(
          trust === 'unsigned'
            ? { source: 'fortis_attested', status_code: statusCode, reason_code_id: reasonCode }
            : body
        ),
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
