/**
 * Fortis onboarding status reconciliation.
 *
 * What Fortis actually offers (verified 2026-09-04 against api.fortis.tech with
 * the production onboarding credentials — see the session notes in the
 * "scheduled onboarding poll" commit):
 *
 *   - POST /v1/onboarding creates the Merchant Processing Application (MPA).
 *     There is NO endpoint to read an application's status afterwards:
 *     GET /v1/onboarding/{client_app_id} answers "Route not found", and the
 *     official Fortis SDK's OnBoardingController exposes only the POST.
 *   - Approval — and the merchant API credentials (`users[].user_api_key`) —
 *     are delivered exclusively by the onboarding webhook
 *     (/fortiswebhooks/merchant_account_status_listener).
 *   - GET /v1/users IS readable with the office-level onboarding user. It lists
 *     every user under the office hierarchy, including the
 *     `api.<LegalName>@<merchant-domain>` user Fortis provisions the moment a
 *     merchant is approved, together with that user's `primary_location_id`.
 *     `user_api_key` is masked in the response ("3...6"), so credentials can
 *     NOT be recovered this way — but approval CAN be detected.
 *   - GET /v1/locations and /v1/product-transactions are 403 for that user.
 *   - MPA onboarding postbacks are not manageable through /v1/webhooks (only
 *     contact / transaction / transactionbatch / apm-onboarding are), so the
 *     callback registration lives in the Fortis portal, per agent/template.
 *
 * Hence this module reconciles in three ways:
 *   1. Replay a stored onboarding webhook that was received but never applied
 *      (row in fortis_webhooks, but the record still isn't ACTIVE/DENIED).
 *   2. Detect approval through the users list and move the record to APPROVED
 *      — location and API user id are known, the API key is still pending —
 *      and raise an ops alert, so a lost webhook becomes a visible incident
 *      instead of a merchant stuck on "sign the agreement" for days.
 *   3. Record that the merchant signed the MPA (PENDING_REVIEW) when the
 *      merchant or the agency tells us so. Fortis gives us no signal for that.
 *
 * Status vocabulary (church_onboard_fortis.app_status):
 *   PENDING                → steps 1–2 not finished
 *   BANK_INFORMATION_SENT  → MPA created at Fortis; merchant must sign it
 *   PENDING_REVIEW         → MPA signed; Fortis underwriting in progress
 *                            (merchant/agency confirmation, or Fortis "pended")
 *   APPROVED               → Fortis provisioned the merchant account; LunarPay
 *                            is still waiting for the credentials webhook
 *   ACTIVE                 → credentials on file; processing enabled
 *   DENIED                 → Fortis declined/closed the application
 *   FORM_ERROR             → the onboarding POST itself failed
 */

import { after } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createFortisClient, FortisClient, FortisUserRecord } from '@/lib/fortis/client';
import { notifyAgencyOfStatusChange } from '@/lib/agency-webhook';
import { sendEmail } from '@/lib/email';

export type OnboardingAppStatus =
  | 'PENDING'
  | 'BANK_INFORMATION_SENT'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'ACTIVE'
  | 'DENIED'
  | 'FORM_ERROR';

/** Statuses a scheduled reconciliation should still look at. */
export const RECONCILABLE_STATUSES: OnboardingAppStatus[] = [
  'BANK_INFORMATION_SENT',
  'PENDING_REVIEW',
  'APPROVED',
];

/** Terminal statuses: nothing left to sync. */
export const TERMINAL_STATUSES: OnboardingAppStatus[] = ['ACTIVE', 'DENIED'];

export interface SyncResult {
  organizationId: number;
  previousStatus: string | null;
  status: string | null;
  changed: boolean;
  /** Which reconciliation path produced the change (or why nothing changed). */
  source:
    | 'already_terminal'
    | 'no_onboarding'
    | 'not_submitted'
    | 'stored_webhook'
    | 'fortis_users'
    | 'auto_provisioned'
    | 'manual_credentials'
    | 'no_change'
    | 'fortis_error';
  /** Safe to show to a merchant. */
  message: string;
  /** Raw Fortis / configuration error text — logs and admin responses only. */
  detail?: string;
  locationId?: string | null;
  hasCredentials?: boolean;
}

export type NotifyMode = 'await' | 'after';

/**
 * Agency webhook delivery retries with backoff and can outlive a request. In
 * request handlers we hand it to next/server's after(); the cron awaits it.
 * If after() is unavailable (no request scope) fall back to fire-and-forget
 * rather than failing the status change.
 */
async function deliverAgencyNotification(mode: NotifyMode, send: () => Promise<void>): Promise<void> {
  if (mode === 'await') {
    await send();
    return;
  }
  try {
    after(() => send());
  } catch {
    void send();
  }
}

export interface ManualCredentials {
  authUserId: string;
  authUserApiKey: string;
  locationId?: string | null;
  productTransactionId?: string | null;
  achProductTransactionId?: string | null;
}

// ─── helpers ────────────────────────────────────────────────────────────────

/** "Marketing.biz Payments, LLC" → "marketingbizpaymentsllc" */
export function normalizeBusinessName(name: string | null | undefined): string {
  return (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function emailDomain(email: string | null | undefined): string | null {
  const at = (email || '').trim().toLowerCase().lastIndexOf('@');
  if (at < 0) return null;
  const domain = (email as string).trim().toLowerCase().slice(at + 1);
  return domain || null;
}

/**
 * Public mailbox providers. Two unrelated merchants can share one of these, so
 * a shared domain there is no evidence of identity at all.
 */
export const PUBLIC_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'ymail.com', 'hotmail.com', 'outlook.com',
  'live.com', 'msn.com', 'icloud.com', 'me.com', 'mac.com', 'aol.com', 'protonmail.com',
  'proton.me', 'comcast.net', 'att.net', 'verizon.net', 'sbcglobal.net', 'bellsouth.net',
  'cox.net', 'charter.net', 'earthlink.net', 'mail.com', 'zoho.com', 'gmx.com', 'yandex.com',
]);

export function isPublicEmailDomain(domain: string | null | undefined): boolean {
  return !!domain && PUBLIC_EMAIL_DOMAINS.has(domain.toLowerCase());
}

/**
 * Fortis names the provisioned users `api.<LegalNameStripped>@<domain>` /
 * `admin.<LegalNameStripped>@<domain>`, where the local part is the legal
 * name with everything non-alphanumeric removed and (apparently) truncated —
 * "Uplifting Custom Creations" became `api.UpliftingCustomCreation@…`,
 * "Marketing.biz Payments LLC" became `api.MarketingbizPaymentsLL@…`.
 *
 * On a domain the merchant owns, the domain itself is strong evidence, so a
 * prefix in either direction (≥ 6 chars) is accepted. On a public mailbox
 * domain only equality, or Fortis's own truncation (the Fortis name is a
 * reasonably long prefix of ours), counts — "gracechurch" must not claim
 * `api.GraceChurchOfAtlanta@gmail.com`.
 */
function namesCorrespond(fortisLocalPart: string, candidates: string[], strict: boolean): boolean {
  const local = fortisLocalPart.toLowerCase();
  if (local.length < 6) return false;
  return candidates.some((c) => {
    if (!c || c.length < 6) return false;
    if (local === c) return true;
    if (strict) return local.length >= 12 && c.startsWith(local);
    return local.startsWith(c) || c.startsWith(local);
  });
}

export interface ApprovalMatchContext {
  legalName: string | null | undefined;
  dbaName: string | null | undefined;
  /** Contact/application emails, most specific first. */
  emails: Array<string | null | undefined>;
  /** Only users created at/after this instant are candidates (application time minus slack). */
  notBefore: Date;
  /** Location ids already owned by other merchants — never re-assign those. */
  knownLocationIds: Set<string>;
  /**
   * Permit a domain-only match (no name correspondence). Callers may only set
   * this when the domain is private AND no other record in our database uses
   * it; even then the caller must treat the result as a hint, not a fact.
   */
  allowDomainOnlyFallback?: boolean;
}

export interface ApprovalMatch {
  user: FortisUserRecord;
  locationId: string;
  /** 'name+domain' is the strong match; 'domain' is a unique-domain hint. */
  confidence: 'name+domain' | 'domain';
}

/**
 * Pure matcher: find the merchant's provisioned Fortis API user in a users list.
 * Returns null when nothing matches OR when the evidence is ambiguous (name
 * matches spanning more than one Fortis location). Exported so it can be
 * unit-tested without the API.
 */
export function findApprovedMerchantUser(
  users: FortisUserRecord[],
  ctx: ApprovalMatchContext
): ApprovalMatch | null {
  const domains = new Set(
    ctx.emails.map(emailDomain).filter((d): d is string => !!d)
  );
  if (domains.size === 0) return null;

  const nameCandidates = [normalizeBusinessName(ctx.legalName), normalizeBusinessName(ctx.dbaName)].filter(
    (n) => n.length >= 6
  );
  const notBeforeTs = Math.floor(ctx.notBefore.getTime() / 1000);

  const candidates = users.filter((u) => {
    if (!u.primaryLocationId) return false;
    if (u.statusCode !== null && u.statusCode !== 1) return false;
    if (/^DELETE-/i.test(u.username)) return false;
    if (u.createdTs !== null && u.createdTs < notBeforeTs) return false;
    if (ctx.knownLocationIds.has(u.primaryLocationId)) return false;
    const uname = u.username.toLowerCase();
    if (!uname.startsWith('api.') && !uname.startsWith('admin.')) return false;
    const domain = emailDomain(u.username) || emailDomain(u.email);
    return !!domain && domains.has(domain);
  });

  if (candidates.length === 0) return null;

  // Prefer the api.* user (that is the one the webhook hands us as users[0]).
  const ordered = [...candidates].sort((a, b) => {
    const aa = a.username.toLowerCase().startsWith('api.') ? 0 : 1;
    const bb = b.username.toLowerCase().startsWith('api.') ? 0 : 1;
    return aa - bb;
  });

  const byName = ordered.filter((u) => {
    const domain = (emailDomain(u.username) || emailDomain(u.email)) as string;
    const localPart = u.username.toLowerCase().replace(/^(api|admin)\./, '').split('@')[0];
    return nameCandidates.length > 0 && namesCorrespond(localPart, nameCandidates, isPublicEmailDomain(domain));
  });
  const byNameLocations = new Set(byName.map((u) => u.primaryLocationId as string));
  if (byNameLocations.size > 1) {
    // Two different Fortis locations both look like this merchant. Refuse to guess.
    return null;
  }
  if (byName.length > 0) {
    const u = byName[0];
    return { user: u, locationId: u.primaryLocationId as string, confidence: 'name+domain' };
  }

  // Domain-only hint: the caller decides whether this domain is trustworthy.
  if (ctx.allowDomainOnlyFallback) {
    const locations = new Set(ordered.map((u) => u.primaryLocationId as string));
    if (locations.size === 1 && !isPublicEmailDomain([...domains][0])) {
      const u = ordered[0];
      return { user: u, locationId: u.primaryLocationId as string, confidence: 'domain' };
    }
  }

  return null;
}

/**
 * Loose shape of a Fortis onboarding webhook body. Every field is optional:
 * Fortis sometimes nests the payload under `data`, and internal payment-logger
 * rows share the same table, so nothing here can be assumed present.
 */
interface WebhookProductTransaction {
  id?: string;
  payment_method?: string;
}

interface WebhookLocation {
  id?: string;
  product_transactions?: WebhookProductTransaction[];
}

interface WebhookUser {
  user_id?: string;
  user_api_key?: string;
  location_id?: string;
  locations?: WebhookLocation[];
}

export interface OnboardingWebhookBody {
  status?: { response_code?: string };
  data?: OnboardingWebhookBody;
  client_app_id?: string | number;
  users?: WebhookUser[];
  location_id?: string;
  locations?: WebhookLocation[];
  product_transactions?: WebhookProductTransaction[];
  product_transaction_id?: string;
}

/**
 * Pull credentials/location/product ids out of an onboarding webhook payload.
 * Same precedence as lib/fortis/webhook-handler.ts.
 */
export function extractWebhookCredentials(rawBody: OnboardingWebhookBody | null | undefined): {
  responseCode: string | null;
  userId: string | null;
  userApiKey: string | null;
  locationId: string | null;
  ccProductTransactionId: string | null;
  achProductTransactionId: string | null;
} {
  const data: OnboardingWebhookBody = rawBody?.data || rawBody || {};
  const status = rawBody?.status || data.status;
  const responseCode: string | null =
    typeof status?.response_code === 'string' ? status.response_code.toLowerCase() : null;

  const users: WebhookUser[] = Array.isArray(data.users) ? data.users : [];
  const merchantUser = users[0] || null;

  let locationId: string | null = data.location_id || null;
  if (!locationId && merchantUser?.location_id) locationId = merchantUser.location_id;
  if (!locationId && merchantUser?.locations?.length) locationId = merchantUser.locations[0].id || null;
  if (!locationId && Array.isArray(data.locations) && data.locations.length) locationId = data.locations[0].id || null;

  let cc: string | null = null;
  let ach: string | null = null;
  const topLevel: WebhookProductTransaction[] = Array.isArray(data.product_transactions)
    ? data.product_transactions
    : Array.isArray(rawBody?.product_transactions)
      ? rawBody.product_transactions
      : [];
  for (const pt of topLevel) {
    const method = String(pt?.payment_method || '').toLowerCase();
    if (method === 'cc' && !cc) cc = pt.id || null;
    if (method === 'ach' && !ach) ach = pt.id || null;
  }
  if (!cc && !ach && Array.isArray(data.locations)) {
    for (const loc of data.locations) {
      for (const pt of loc?.product_transactions || []) {
        const method = String(pt?.payment_method || '').toLowerCase();
        if (method === 'cc' && !cc) cc = pt.id || null;
        if (method === 'ach' && !ach) ach = pt.id || null;
      }
    }
  }
  if (!cc && data.product_transaction_id) cc = data.product_transaction_id;

  return {
    responseCode,
    userId: merchantUser?.user_id || null,
    userApiKey: merchantUser?.user_api_key || null,
    locationId,
    ccProductTransactionId: cc,
    achProductTransactionId: ach,
  };
}

async function loadOnboarding(organizationId: number) {
  return prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      userId: true,
      name: true,
      legalName: true,
      email: true,
      fortisOnboarding: true,
      user: { select: { email: true, agencyId: true, agency: { select: { name: true } } } },
    },
  });
}

type LoadedOrg = NonNullable<Awaited<ReturnType<typeof loadOnboarding>>>;

async function activate(
  org: LoadedOrg,
  creds: ManualCredentials,
  source: SyncResult['source'],
  notify: NotifyMode,
  processorResponse?: string
): Promise<SyncResult> {
  const onboarding = org.fortisOnboarding!;
  const previousStatus = onboarding.appStatus;

  const data = {
    authUserId: creds.authUserId,
    authUserApiKey: creds.authUserApiKey,
    locationId: creds.locationId ?? onboarding.locationId,
    productTransactionId: creds.productTransactionId ?? onboarding.productTransactionId,
    achProductTransactionId: creds.achProductTransactionId ?? onboarding.achProductTransactionId,
    ...(processorResponse ? { processorResponse } : {}),
    updatedAt: new Date(),
  };

  // Who may write the key column?
  //  - a run that just minted, or an operator pasting a key from the Fortis
  //    portal: theirs is by definition the newest key → unconditional;
  //  - a webhook replay: only when the column holds nothing or this very key
  //    (any other real key was minted after the webhook's key was issued; a
  //    claim token means a mint is in flight and this key may be dead).
  const keyIsNewest = source === 'auto_provisioned' || source === 'manual_credentials';
  const keyIsReplaceable = keyIsNewest
    ? {}
    : { OR: [{ authUserApiKey: null }, { authUserApiKey: creds.authUserApiKey }] };
  const noClaimInFlight = { NOT: { authUserApiKey: { startsWith: PROVISIONING_CLAIM_PREFIX } } };
  const { authUserId, authUserApiKey, ...nonCredentialData } = data;

  // 1. Flip to ACTIVE with our credentials, if the row is still open and the
  //    key is ours to write.
  let flipped = await prisma.fortisOnboarding.updateMany({
    where: { id: onboarding.id, appStatus: { notIn: ['ACTIVE', 'DENIED'] }, ...keyIsReplaceable },
    data: { ...data, appStatus: 'ACTIVE' },
  });
  // 2. Otherwise flip around a newer REAL key, if the row is still open.
  if (flipped.count === 0) {
    flipped = await prisma.fortisOnboarding.updateMany({
      where: { id: onboarding.id, appStatus: { notIn: ['ACTIVE', 'DENIED'] }, ...noClaimInFlight },
      data: { ...nonCredentialData, appStatus: 'ACTIVE' },
    });
  }
  // 3. Nothing flipped: the row is terminal, or a mint is in flight. Never
  //    regress, never notify twice.
  if (flipped.count === 0) {
    const fresh = await prisma.fortisOnboarding.findUnique({
      where: { id: onboarding.id },
      select: { appStatus: true, authUserApiKey: true },
    });
    if (fresh && fresh.appStatus !== 'ACTIVE' && fresh.appStatus !== 'DENIED') {
      // A claim landed between our read and our write: record what we know
      // and let the minting run finish.
      await prisma.fortisOnboarding.updateMany({
        where: { id: onboarding.id, appStatus: { notIn: ['ACTIVE', 'DENIED'] } },
        data: nonCredentialData,
      });
      console.log(`[Onboarding Sync] Org ${org.id}: key mint in flight; ${source} recorded details only`);
      return {
        organizationId: org.id,
        previousStatus,
        status: fresh.appStatus,
        changed: false,
        source,
        message: 'Approved at Fortis; finishing activation',
        locationId: data.locationId,
        hasCredentials: false,
      };
    }
    if (fresh?.appStatus === 'DENIED') {
      console.warn(`[Onboarding Sync] Org ${org.id} is DENIED; ignoring ${source} credentials`);
      return {
        organizationId: org.id,
        previousStatus: 'DENIED',
        status: 'DENIED',
        changed: false,
        source,
        message: 'Application was declined; credentials ignored',
      };
    }
    await prisma.fortisOnboarding.updateMany({
      where: { id: onboarding.id, ...keyIsReplaceable },
      data: { authUserId, authUserApiKey, updatedAt: data.updatedAt },
    });
    await prisma.fortisOnboarding.update({ where: { id: onboarding.id }, data: nonCredentialData });
    console.log(`[Onboarding Sync] Org ${org.id} was already ACTIVE; refreshed via ${source}`);
    return {
      organizationId: org.id,
      previousStatus: 'ACTIVE',
      status: 'ACTIVE',
      changed: false,
      source,
      message: 'Already ACTIVE; credentials refreshed',
      locationId: data.locationId,
      hasCredentials: true,
    };
  }

  console.log(`[Onboarding Sync] Org ${org.id} → ACTIVE via ${source}`);

  // The approval signal agencies depend on. Deferred (or awaited) so the retry
  // backoff survives the caller's response.
  await deliverAgencyNotification(notify, () =>
    notifyAgencyOfStatusChange(org.userId, org.id, 'ACTIVE', previousStatus)
  );

  return {
    organizationId: org.id,
    previousStatus,
    status: 'ACTIVE',
    changed: true,
    source,
    message: 'Merchant credentials applied; status is ACTIVE',
    locationId: data.locationId,
    hasCredentials: true,
  };
}

async function deny(
  org: LoadedOrg,
  source: SyncResult['source'],
  notify: NotifyMode,
  processorResponse?: string
): Promise<SyncResult> {
  const onboarding = org.fortisOnboarding!;
  const previousStatus = onboarding.appStatus;
  await prisma.fortisOnboarding.update({
    where: { id: onboarding.id },
    data: {
      appStatus: 'DENIED',
      ...(processorResponse ? { processorResponse } : {}),
      updatedAt: new Date(),
    },
  });
  console.log(`[Onboarding Sync] Org ${org.id} → DENIED via ${source}`);
  await deliverAgencyNotification(notify, () =>
    notifyAgencyOfStatusChange(org.userId, org.id, 'DENIED', previousStatus)
  );
  return {
    organizationId: org.id,
    previousStatus,
    status: 'DENIED',
    changed: true,
    source,
    message: 'Fortis declined/closed the application',
  };
}

/**
 * 1. Replay the newest stored onboarding webhook for this org, if any.
 * Returns null when there is nothing actionable.
 */
async function replayStoredWebhook(org: LoadedOrg, notify: NotifyMode): Promise<SyncResult | null> {
  const rows = await prisma.fortisWebhook.findMany({
    where: { eventJson: { contains: `"client_app_id":"${org.id}"` } },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  for (const row of rows) {
    let payload: OnboardingWebhookBody;
    try {
      payload = JSON.parse(row.eventJson);
    } catch {
      continue;
    }
    // Internal payment-logger rows also land in this table; only real Fortis
    // onboarding payloads carry a client_app_id at the top level or under data.
    const data = payload?.data || payload;
    if (String(data?.client_app_id) !== String(org.id)) continue;

    const creds = extractWebhookCredentials(payload);
    if (creds.responseCode === 'declined' || creds.responseCode === 'closed') {
      return deny(org, 'stored_webhook', notify, row.eventJson);
    }
    if (creds.userId && creds.userApiKey) {
      // A real key already on file was minted by us AFTER this webhook's key
      // was issued, which invalidated the webhook's key. Keep ours; take the
      // location/products from the webhook and finish activation.
      const stored = org.fortisOnboarding!;
      // A claim token means a mint is in flight (or died mid-way, in which
      // case it is re-minted within minutes) and this webhook's key may be
      // dead: mirror the live handler — record the location/products only.
      if (stored.authUserApiKey && stored.authUserApiKey.startsWith(PROVISIONING_CLAIM_PREFIX)) {
        await prisma.fortisOnboarding.updateMany({
          where: { id: stored.id, appStatus: { notIn: ['ACTIVE', 'DENIED'] } },
          data: {
            locationId: creds.locationId ?? stored.locationId,
            productTransactionId: creds.ccProductTransactionId || creds.achProductTransactionId || stored.productTransactionId,
            achProductTransactionId: creds.achProductTransactionId ?? stored.achProductTransactionId,
            updatedAt: new Date(),
          },
        });
        return null;
      }
      // A stored key for the SAME user is newer than the webhook's (minting
      // invalidated the webhook's). A stored key for another user is worthless.
      const keepStored =
        isRealApiKey(stored.authUserApiKey) &&
        stored.authUserId === creds.userId &&
        stored.authUserApiKey !== creds.userApiKey;
      return activate(
        org,
        {
          authUserId: keepStored ? stored.authUserId || creds.userId : creds.userId,
          authUserApiKey: keepStored ? (stored.authUserApiKey as string) : creds.userApiKey,
          locationId: creds.locationId ?? stored.locationId,
          productTransactionId: creds.ccProductTransactionId || creds.achProductTransactionId,
          achProductTransactionId: creds.achProductTransactionId,
        },
        'stored_webhook',
        notify,
        row.eventJson
      );
    }
  }
  return null;
}

/**
 * True when some OTHER organization, onboarding record or user in our database
 * uses this email domain. A domain shared inside LunarPay can never identify
 * one merchant at Fortis.
 */
async function domainSharedWithOtherRecords(domain: string, org: LoadedOrg): Promise<boolean> {
  const suffix = `@${domain}`;
  const [onboardings, organizations, users] = await Promise.all([
    prisma.fortisOnboarding.count({
      where: { organizationId: { not: org.id }, email: { endsWith: suffix, mode: 'insensitive' } },
    }),
    prisma.organization.count({
      where: { id: { not: org.id }, email: { endsWith: suffix, mode: 'insensitive' } },
    }),
    prisma.user.count({
      where: { id: { not: org.userId }, email: { endsWith: suffix, mode: 'insensitive' } },
    }),
  ]);
  return onboardings + organizations + users > 0;
}

/**
 * Self-provisioning: when Fortis's approval webhook does not deliver the
 * merchant's credentials, mint them ourselves.
 *
 * Disabled by setting ONBOARDING_AUTO_PROVISION=false once Fortis has
 * registered the postback for every agent. The toggle gates only the MINT: a
 * record that already holds a minted key always finishes activation.
 */
function autoProvisionEnabled(): boolean {
  const raw = (process.env.ONBOARDING_AUTO_PROVISION || '').trim().toLowerCase();
  return !(raw === 'false' || raw === '0' || raw === 'off' || raw === 'no');
}

/**
 * How long after Fortis provisions the api.* user we give the approval webhook
 * before rotating the key ourselves. Fortis posts at approval time and retries
 * for a few minutes; a postback that has not arrived after this is not coming.
 */
const WEBHOOK_GRACE_MS = 10 * 60 * 1000;

/**
 * While a run is minting, the key column holds a claim token instead of a
 * key, so no second run can mint concurrently. A claim older than this is
 * assumed to belong to a run that died and may be taken over.
 */
export const PROVISIONING_CLAIM_PREFIX = 'PROVISIONING:';
const CLAIM_STALE_MS = 5 * 60 * 1000;

/** A usable Fortis API key on file (not empty, not an in-flight claim). */
export function isRealApiKey(key: string | null | undefined): key is string {
  return !!key && !key.startsWith(PROVISIONING_CLAIM_PREFIX);
}

/** Each provisioning is mint + location read + activation + agency webhook; cap per cron run. */
const MAX_PROVISIONS_PER_RUN = 3;

export interface ProvisionBudget {
  remaining: number;
}

/** Is this Fortis user a valid API identity for the given location? */
function isUsableApiUser(u: FortisUserRecord | undefined, locationId: string): u is FortisUserRecord {
  if (!u) return false;
  if (u.statusCode !== null && u.statusCode !== 1) return false;
  if (/^DELETE-/i.test(u.username)) return false;
  if (!u.username.toLowerCase().startsWith('api.')) return false;
  return u.primaryLocationId === locationId;
}

function approvedResult(
  org: LoadedOrg,
  previousStatus: string | null,
  locationId: string,
  message: string,
  extra: Partial<SyncResult> = {}
): SyncResult {
  return {
    organizationId: org.id,
    previousStatus,
    status: 'APPROVED',
    changed: previousStatus !== 'APPROVED',
    source: 'fortis_users',
    message,
    locationId,
    hasCredentials: isRealApiKey(org.fortisOnboarding?.authUserApiKey),
    ...extra,
  };
}

/**
 * Mint the merchant's API key, read the location's products, and activate.
 *
 * Ordering is the whole point:
 *   1. CLAIM the row atomically (conditional update that only succeeds when no
 *      key and no live claim is on it), so two overlapping runs cannot both
 *      mint — the second mint would silently kill the first key.
 *   2. POST /v1/users/{id}/api-key rotates the key — the previous one (the one
 *      a late webhook would carry) is dead from this moment.
 *   3. The new key is persisted IMMEDIATELY and unconditionally (it is the only
 *      valid key now), without ever lowering an ACTIVE status.
 *   4. Products are read with the merchant's own credentials (the office user
 *      is 403 on /v1/locations), then the record goes ACTIVE and the agency is
 *      told — unless another path already activated it, in which case only the
 *      credentials are refreshed and no second merchant.approved is sent.
 *      If the location read fails the record stays APPROVED with the key
 *      stored and the next run resumes from step 4 without minting again.
 *
 * Mutual exclusion with the webhook path (see webhook-handler.ts and
 * replayStoredWebhook): a real key on file always wins over the key in a
 * webhook, because any key we hold was minted after the webhook's key was
 * issued and therefore invalidated it.
 */
async function provisionCredentials(
  org: LoadedOrg,
  apiUser: FortisUserRecord,
  locationId: string,
  notify: NotifyMode,
  opts: { budget?: ProvisionBudget; alertOnFailure?: boolean }
): Promise<SyncResult> {
  const onboarding = org.fortisOnboarding!;
  const statusBefore = onboarding.appStatus;
  const apiUserId = apiUser.id;

  const fail = async (detail: string, message: string = FORTIS_UNAVAILABLE_MESSAGE): Promise<SyncResult> => {
    console.error(`[Onboarding Sync] Org ${org.id}: provisioning failed — ${detail}`);
    // Alert once per distinct failure, not on every 15-minute retry.
    if (opts.alertOnFailure && lastProvisionFailure.get(org.id) !== detail) {
      lastProvisionFailure.set(org.id, detail);
      await sendOpsAlert(org, { mode: 'provision_failed', user: apiUser, locationId, detail });
    }
    return approvedResult(org, statusBefore, locationId, message, {
      source: 'fortis_error',
      detail,
      hasCredentials: isRealApiKey(apiKey),
    });
  };

  // Step 1–3: mint, unless a previous run already stored a key for this user.
  let mintedThisRun = false;
  let apiKey: string | null =
    isRealApiKey(onboarding.authUserApiKey) && onboarding.authUserId === apiUserId
      ? onboarding.authUserApiKey
      : null;

  if (!apiKey) {
    if (!autoProvisionEnabled()) {
      return approvedResult(org, statusBefore, locationId, 'Approved at Fortis; waiting for the credentials webhook (self-provisioning is off)');
    }
    if (opts.budget && opts.budget.remaining <= 0) {
      return approvedResult(org, statusBefore, locationId, 'Approved at Fortis; provisioning deferred to the next run (per-run cap reached)');
    }

    const now = new Date();
    const claimToken = `${PROVISIONING_CLAIM_PREFIX}${now.getTime()}`;

    // What may we overwrite? An empty column; a claim whose own timestamp says
    // the run that made it died (never judged by updatedAt, which unrelated
    // writers bump); or a real key that belongs to a different, now-invalid
    // user id. Matching the exact current value keeps the claim atomic.
    const current = onboarding.authUserApiKey;
    let replaceable: string | null = null;
    if (current && current.startsWith(PROVISIONING_CLAIM_PREFIX)) {
      const stamped = Number(current.slice(PROVISIONING_CLAIM_PREFIX.length));
      if (!Number.isFinite(stamped) || now.getTime() - stamped > CLAIM_STALE_MS) replaceable = current;
    } else if (isRealApiKey(current) && onboarding.authUserId !== apiUserId) {
      replaceable = current;
    }

    const claimed = await prisma.fortisOnboarding.updateMany({
      where: {
        id: onboarding.id,
        appStatus: { notIn: ['ACTIVE', 'DENIED'] },
        OR: [{ authUserApiKey: null }, ...(replaceable ? [{ authUserApiKey: replaceable }] : [])],
      },
      data: {
        authUserApiKey: claimToken,
        authUserId: apiUserId,
        locationId,
        appStatus: 'APPROVED',
        updatedAt: now,
      },
    });
    if (claimed.count === 0) {
      return approvedResult(org, statusBefore, locationId, 'Approved at Fortis; another run is finishing provisioning');
    }
    if (opts.budget) opts.budget.remaining -= 1;

    // The claim is deliberately NOT released on failure: a timed-out mint may
    // still have rotated the key at Fortis, so any key a webhook delivers from
    // here on may be dead. The stale-claim takeover re-mints on a later run.
    let officeClient: FortisClient;
    try {
      officeClient = createFortisClient();
    } catch (err) {
      return fail(`Fortis client unavailable: ${(err as Error).message}`);
    }

    const minted = await officeClient.createUserApiKey(apiUserId);
    if (!minted.status || !minted.apiKey) {
      return fail(`could not mint an API key for user ${apiUser.username}: ${minted.message || 'unknown error'}`);
    }
    apiKey = minted.apiKey;
    mintedThisRun = true;

    // The minted key is now the only valid one: persist it with ONE
    // unconditional write, whatever landed on the row meanwhile. The status
    // bump is separate and never lowers a terminal status.
    await prisma.fortisOnboarding.update({
      where: { id: onboarding.id },
      data: { authUserId: apiUserId, authUserApiKey: apiKey, updatedAt: new Date() },
    });
    await prisma.fortisOnboarding.updateMany({
      where: { id: onboarding.id, appStatus: { notIn: ['ACTIVE', 'DENIED'] } },
      data: { appStatus: 'APPROVED', locationId, updatedAt: new Date() },
    });
    console.warn(
      `[Onboarding Sync] Org ${org.id}: minted a new Fortis API key for ${apiUser.username} (the approval webhook never delivered one)`
    );
  }

  // Step 4: products, then activate.
  let merchantClient: FortisClient;
  try {
    merchantClient = createFortisClient(undefined, apiUserId, apiKey);
  } catch (err) {
    return fail(`merchant client unavailable: ${(err as Error).message}`);
  }
  const location = await merchantClient.getLocation(locationId, {
    expand: ['product_transactions'],
    timeout: 15000,
  });
  if (!location.status || !location.location) {
    return fail(`key stored, but reading location ${locationId} with it failed: ${location.message || 'unknown error'}`);
  }

  let cc: string | null = null;
  let ach: string | null = null;
  for (const pt of location.location.product_transactions || []) {
    if (!pt?.id) continue;
    if (pt.active !== undefined && pt.active !== 1 && pt.active !== true) continue;
    const method = String(pt.payment_method || '').toLowerCase();
    if (method === 'cc' && !cc) cc = pt.id;
    if (method === 'ach' && !ach) ach = pt.id;
  }
  if (!cc && !ach) {
    return fail(
      `location ${locationId} has no active card or ACH product yet`,
      'Approved at Fortis; the merchant account is still being set up'
    );
  }

  const result = await activate(
    org,
    {
      authUserId: apiUserId,
      authUserApiKey: apiKey,
      locationId,
      productTransactionId: cc || ach,
      achProductTransactionId: ach,
    },
    'auto_provisioned',
    notify
  );

  // The mint itself is the evidence that the webhook never came — alert on it
  // even if another run happened to perform the final flip.
  if (mintedThisRun && result.status === 'ACTIVE') {
    lastProvisionFailure.delete(org.id);
    await sendOpsAlert(org, { mode: 'auto_activated', user: apiUser, locationId });
  }

  return {
    ...result,
    message:
      mintedThisRun && result.changed
        ? 'Approved at Fortis; credentials minted automatically because no webhook arrived — merchant is ACTIVE'
        : result.message,
  };
}

/**
 * 2. Detect approval through GET /v1/users, then self-provision.
 *
 * Only a name+domain match on the api.* user is allowed to change the record.
 * A domain-only match (private domain, unique in our database, but the legal
 * name on the Fortis user doesn't line up) is reported to ops as a hint and
 * NOT written — mis-assigning another merchant's location is far worse than a
 * delayed approval.
 */
async function detectApprovalViaUsers(
  org: LoadedOrg,
  users: FortisUserRecord[],
  knownLocationIds: Set<string>,
  notify: NotifyMode,
  opts: { budget?: ProvisionBudget; alertOnFailure?: boolean }
): Promise<SyncResult | null> {
  const onboarding = org.fortisOnboarding!;

  // Resume: the location was detected on a previous run. Never trust the
  // stored user id blindly — find a usable api.* user on that location in the
  // live list (the stored one if it still qualifies, else whatever Fortis has
  // now), then finish provisioning once the webhook's grace period has passed.
  // No re-detection and no re-alerting for a location we already know.
  if (onboarding.appStatus === 'APPROVED' && onboarding.locationId) {
    const locationId = onboarding.locationId;
    const stored = users.find((u) => u.id === onboarding.authUserId);
    const apiUser = isUsableApiUser(stored, locationId) ? stored : users.find((u) => isUsableApiUser(u, locationId));
    if (!apiUser) return null; // Fortis has not (re)created the api.* user yet; wait.

    const sameUser = apiUser.id === onboarding.authUserId;
    const hasKey = sameUser && isRealApiKey(onboarding.authUserApiKey);
    const provisionedAt = apiUser.createdTs ? apiUser.createdTs * 1000 : onboarding.updatedAt?.getTime() ?? 0;
    if (!hasKey && Date.now() - provisionedAt < WEBHOOK_GRACE_MS) return null;

    if (!sameUser && isRealApiKey(onboarding.authUserApiKey)) {
      // The user we minted for is gone; that key is worthless. Drop it so the
      // claim can proceed for the replacement user. Conditional on the exact
      // value so a concurrent mint is never clobbered.
      await prisma.fortisOnboarding.updateMany({
        where: { id: onboarding.id, authUserApiKey: onboarding.authUserApiKey, appStatus: { notIn: ['ACTIVE', 'DENIED'] } },
        data: { authUserApiKey: null, authUserId: apiUser.id, updatedAt: new Date() },
      });
      org = { ...org, fortisOnboarding: { ...onboarding, authUserApiKey: null, authUserId: apiUser.id } };
    }
    return provisionCredentials(org, apiUser, locationId, notify, opts);
  }

  const emails = [onboarding.email, org.email, org.user?.email];
  const primaryDomain = emailDomain(onboarding.email) || emailDomain(org.email);
  const allowDomainOnlyFallback =
    !!primaryDomain &&
    !isPublicEmailDomain(primaryDomain) &&
    !(await domainSharedWithOtherRecords(primaryDomain, org));

  const notBefore = new Date(onboarding.createdAt.getTime() - 24 * 60 * 60 * 1000);
  const match = findApprovedMerchantUser(users, {
    legalName: org.legalName,
    dbaName: org.name,
    emails,
    notBefore,
    knownLocationIds,
    allowDomainOnlyFallback,
  });
  if (!match) return null;

  if (match.confidence !== 'name+domain') {
    console.warn(
      `[Onboarding Sync] Org ${org.id}: possible approval at Fortis (user ${match.user.username}, location ${match.locationId}, match=${match.confidence}) — not applied, needs a human look`
    );
    await sendOpsAlert(org, { mode: 'hint', user: match.user, locationId: match.locationId });
    return null;
  }

  // Prefer the api.* user on that location even if the matcher surfaced admin.*
  const apiUser = isUsableApiUser(match.user, match.locationId)
    ? match.user
    : users.find((u) => isUsableApiUser(u, match.locationId));

  const previousStatus = onboarding.appStatus;
  // Only an api.* identity is ever stored as the merchant's API user, and a
  // key on file for some other user is worthless — drop it with the same write.
  const keepKey = !!apiUser && apiUser.id === onboarding.authUserId && isRealApiKey(onboarding.authUserApiKey);
  const detected = await prisma.fortisOnboarding.updateMany({
    // Conditional: a webhook may have activated (or Fortis declined) this row
    // while we were talking to Fortis. Never lower a terminal status.
    where: { id: onboarding.id, appStatus: { notIn: ['ACTIVE', 'DENIED'] } },
    data: {
      appStatus: 'APPROVED',
      locationId: match.locationId,
      authUserId: apiUser ? apiUser.id : null,
      updatedAt: new Date(),
    },
  });
  knownLocationIds.add(match.locationId);
  if (detected.count === 0) return null; // became terminal meanwhile; nothing for us to do

  // A real key we saw that belongs to some other user is worthless — drop it,
  // but only if it is still exactly the value we saw (never a live claim or a
  // key another run minted since).
  if (!keepKey && isRealApiKey(onboarding.authUserApiKey)) {
    await prisma.fortisOnboarding.updateMany({
      where: { id: onboarding.id, authUserApiKey: onboarding.authUserApiKey, appStatus: { notIn: ['ACTIVE', 'DENIED'] } },
      data: { authUserApiKey: null, updatedAt: new Date() },
    });
  }

  console.warn(
    `[Onboarding Sync] Org ${org.id} approved at Fortis (user ${match.user.username}, location ${match.locationId}) but no credentials webhook has arrived`
  );

  if (!apiUser) {
    await sendOpsAlert(org, { mode: 'detected', user: match.user, locationId: match.locationId, detail: 'No active api.* user exists on this location yet, so nothing can be minted.' });
    return approvedResult(org, previousStatus, match.locationId, `Fortis provisioned location ${match.locationId}; no API user to mint a key for yet`);
  }

  const provisionedAt = apiUser.createdTs ? apiUser.createdTs * 1000 : Date.now();
  const graceOver = Date.now() - provisionedAt >= WEBHOOK_GRACE_MS;
  if (!autoProvisionEnabled() || !graceOver) {
    await sendOpsAlert(org, { mode: 'detected', user: apiUser, locationId: match.locationId });
    return approvedResult(org, previousStatus, match.locationId, `Fortis provisioned location ${match.locationId} (API user ${apiUser.username}); awaiting credentials webhook`);
  }

  const org2: LoadedOrg = {
    ...org,
    fortisOnboarding: {
      ...onboarding,
      appStatus: 'APPROVED',
      locationId: match.locationId,
      authUserId: apiUser.id,
      authUserApiKey: keepKey ? onboarding.authUserApiKey : null,
    },
  };
  const provisioned = await provisionCredentials(org2, apiUser, match.locationId, notify, opts);
  return { ...provisioned, previousStatus, changed: provisioned.changed || previousStatus !== provisioned.status };
}

interface OpsAlert {
  mode: 'detected' | 'hint' | 'auto_activated' | 'provision_failed';
  user: FortisUserRecord;
  locationId: string;
  detail?: string;
}

async function sendOpsAlert(org: LoadedOrg, alert: OpsAlert): Promise<void> {
  const to = process.env.ADMIN_EMAIL || process.env.ONBOARDING_ALERT_EMAIL;
  if (!to) return;
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://app.lunarpay.com';
    const agent = org.user?.agency?.name ? `the "${org.user.agency.name}" agent` : 'this agent';
    const who = `organization ${org.id} (${org.name})`;
    const postback = `${appUrl}/fortiswebhooks/merchant_account_status_listener`;
    const curl = `curl -X POST "${appUrl}/api/admin/recover-status?admin_key=$CRON_ADMIN_KEY" -H "Content-Type: application/json" -d '{"organizationId": ${org.id}, "authUserId": "${alert.user.id}", "locationId": "${alert.locationId}", "authUserApiKey": "<key from the Fortis portal>"}'`;

    let subject: string;
    let lines: string[];
    switch (alert.mode) {
      case 'auto_activated':
        subject = `[LunarPay] ${org.name} (org ${org.id}) activated automatically — Fortis webhook still missing for ${agent}`;
        lines = [
          `Fortis approved ${who} but never sent the approval webhook. LunarPay minted the merchant's API key itself; the record is ACTIVE and the merchant can process.`,
          '',
          'Nothing to do for this merchant. Do NOT press "New Key" on this user in the Fortis portal — that would invalidate the key LunarPay stored.',
          '',
          `Still open: ask Fortis to register the onboarding postback for ${agent} at ${postback}, so future merchants activate without minting.`,
        ];
        break;
      case 'provision_failed':
        subject = `[LunarPay] ${org.name} (org ${org.id}) approved at Fortis but automatic activation failed`;
        lines = [
          `Fortis approved ${who}; the approval webhook never arrived and LunarPay could not finish activating it automatically.`,
          `Reason: ${alert.detail || 'unknown'}`,
          '',
          'The reconciliation will retry every 15 minutes. If it keeps failing, finish it by hand from the Fortis portal',
          '(auth: ?admin_key=$CRON_ADMIN_KEY or Authorization: Bearer $CRON_SECRET):',
          curl,
          '',
          `And ask Fortis to register the onboarding postback for ${agent} at ${postback}.`,
        ];
        break;
      case 'hint':
        subject = `[LunarPay] Possible Fortis approval for ${org.name} (org ${org.id}) — needs a human look`;
        lines = [
          `A Fortis user on ${who}'s email domain appeared, but its name does not match the legal/DBA name, so NOTHING was written. Verify in the Fortis portal that this location really belongs to this merchant before completing it by hand:`,
          curl,
        ];
        break;
      default:
        subject = `[LunarPay] Fortis approved ${org.name} (org ${org.id}) but no credentials webhook arrived`;
        lines = [
          `Fortis has provisioned a merchant account for ${who}; the record is APPROVED and the merchant cannot process yet.`,
          alert.detail ? alert.detail : 'LunarPay will mint the credentials itself on its next run if the webhook still has not arrived.',
          '',
          `Ask Fortis to register the onboarding postback for ${agent} at ${postback} and to resend the approval for client_app_id ${org.id}.`,
          'To finish by hand instead (auth: ?admin_key=$CRON_ADMIN_KEY or Authorization: Bearer $CRON_SECRET):',
          curl,
        ];
    }

    const facts = [
      `Fortis API user: ${alert.user.username} (${alert.user.id})`,
      `Fortis location: ${alert.locationId}`,
    ];

    await sendEmail({
      to,
      subject,
      category: 'transactional',
      text: [...lines, '', ...facts].join('\n'),
      html: [
        ...lines.filter(Boolean).map((l) => (l.startsWith('curl ') ? `<pre>${escapeHtml(l)}</pre>` : `<p>${escapeHtml(l)}</p>`)),
        `<ul>${facts.map((f) => `<li>${escapeHtml(f)}</li>`).join('')}</ul>`,
      ].join(''),
    });
  } catch (err) {
    console.error('[Onboarding Sync] Failed to send ops alert:', err);
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function knownMerchantLocationIds(excludeOrganizationId?: number): Promise<Set<string>> {
  const rows = await prisma.fortisOnboarding.findMany({
    where: {
      locationId: { not: null },
      ...(excludeOrganizationId ? { organizationId: { not: excludeOrganizationId } } : {}),
    },
    select: { locationId: true },
  });
  const set = new Set<string>();
  for (const r of rows) if (r.locationId) set.add(r.locationId);
  // LunarPay's own location is never a merchant's.
  const own = process.env.fortis_location_id_production || process.env.FORTIS_LOCATION_ID_PRODUCTION;
  if (own) set.add(own.trim());
  return set;
}

// ─── public API ─────────────────────────────────────────────────────────────

export interface SyncOptions {
  /** Reuse a client / users list across many orgs (the cron does this). */
  client?: FortisClient;
  users?: FortisUserRecord[];
  /**
   * Set by the cron when its one shared users call already failed: skip
   * approval detection and report fortis_error instead of calling Fortis
   * again for every organization.
   */
  usersUnavailable?: string;
  knownLocationIds?: Set<string>;
  /**
   * Skip the Fortis call if this organization was checked less than this many
   * ms ago (per server instance). The public token endpoints use it so a
   * merchant hammering "Check status" can't turn into a Fortis rate-limit on
   * the shared onboarding credentials.
   */
  cooldownMs?: number;
  /**
   * How to deliver the agency webhook on a status change. 'after' (default)
   * hands it to next/server's after() so the request can respond while the
   * retry backoff runs.
   */
  notify?: NotifyMode;
  /** Shared across a cron run: how many self-provisionings may still happen. */
  provisionBudget?: ProvisionBudget;
  /** Email ops when self-provisioning fails (the cron sets this; request paths don't). */
  alertOnFailure?: boolean;
}

/** Per-instance memory of the last Fortis users lookup per organization. */
const lastFortisCheckAt = new Map<number, number>();

/** Per-instance memory of the last provisioning failure detail per organization (alert dedupe). */
const lastProvisionFailure = new Map<number, string>();

const FORTIS_UNAVAILABLE_MESSAGE = 'Could not reach Fortis right now. Please try again in a few minutes.';

function fortisError(organizationId: number, status: string | null, detail: string): SyncResult {
  console.error(`[Onboarding Sync] Org ${organizationId}: ${detail}`);
  return {
    organizationId,
    previousStatus: status,
    status,
    changed: false,
    source: 'fortis_error',
    message: FORTIS_UNAVAILABLE_MESSAGE,
    detail,
  };
}

/**
 * Reconcile one organization's onboarding record with Fortis.
 * Never throws for Fortis errors; returns `source: 'fortis_error'` instead.
 */
export async function syncOnboardingStatus(
  organizationId: number,
  opts: SyncOptions = {}
): Promise<SyncResult> {
  const org = await loadOnboarding(organizationId);
  if (!org || !org.fortisOnboarding) {
    return {
      organizationId,
      previousStatus: null,
      status: null,
      changed: false,
      source: 'no_onboarding',
      message: 'Organization or onboarding record not found',
    };
  }

  const onboarding = org.fortisOnboarding;
  const status = onboarding.appStatus;

  if (status && (TERMINAL_STATUSES as string[]).includes(status)) {
    return {
      organizationId,
      previousStatus: status,
      status,
      changed: false,
      source: 'already_terminal',
      message: `Already ${status}`,
      locationId: onboarding.locationId,
      hasCredentials: isRealApiKey(onboarding.authUserApiKey),
    };
  }

  if (!onboarding.mpaLink) {
    return {
      organizationId,
      previousStatus: status,
      status,
      changed: false,
      source: 'not_submitted',
      message: 'Application has not been submitted to Fortis yet (no MPA link)',
    };
  }

  const notify = opts.notify ?? 'after';

  // 1. A webhook we stored but did not apply (e.g. handler raced the record).
  const replayed = await replayStoredWebhook(org, notify);
  if (replayed) return replayed;

  if (opts.usersUnavailable) {
    return fortisError(organizationId, status, opts.usersUnavailable);
  }

  // 2. Approval detection via the users list.
  let users = opts.users;
  if (!users) {
    const last = lastFortisCheckAt.get(organizationId) || 0;
    if (opts.cooldownMs && Date.now() - last < opts.cooldownMs) {
      return {
        organizationId,
        previousStatus: status,
        status,
        changed: false,
        source: 'no_change',
        message:
          status === 'APPROVED'
            ? (isRealApiKey(onboarding.authUserApiKey) ? 'Approved at Fortis; finishing activation' : 'Approved at Fortis; still waiting for the credentials webhook')
            : 'Checked with Fortis a moment ago — no update yet',
        locationId: onboarding.locationId,
        hasCredentials: isRealApiKey(onboarding.authUserApiKey),
      };
    }

    let client: FortisClient;
    try {
      client = opts.client || createFortisClient();
    } catch (err) {
      return fortisError(organizationId, status, `Fortis client unavailable: ${(err as Error).message}`);
    }
    lastFortisCheckAt.set(organizationId, Date.now());
    const listed = await client.listUsers();
    if (!listed.status || !listed.users) {
      return fortisError(organizationId, status, `Fortis users list failed: ${listed.message || 'unknown error'}`);
    }
    users = listed.users;
  }

  const known = opts.knownLocationIds || (await knownMerchantLocationIds(organizationId));
  const approved = await detectApprovalViaUsers(org, users, known, notify, {
    budget: opts.provisionBudget,
    alertOnFailure: opts.alertOnFailure,
  });
  if (approved) return approved;

  return {
    organizationId,
    previousStatus: status,
    status,
    changed: false,
    source: 'no_change',
    message:
      status === 'APPROVED'
        ? (isRealApiKey(onboarding.authUserApiKey) ? 'Approved at Fortis; finishing activation' : 'Approved at Fortis; still waiting for the credentials webhook')
        : 'No approval visible at Fortis yet',
    locationId: onboarding.locationId,
    hasCredentials: isRealApiKey(onboarding.authUserApiKey),
  };
}

/**
 * Reconcile every non-terminal, submitted onboarding record. One Fortis users
 * call is shared across all of them. Safe to run repeatedly (idempotent).
 */
export async function syncAllPendingOnboardings(opts: {
  limit?: number;
  organizationId?: number;
} = {}): Promise<{
  checked: number;
  changed: SyncResult[];
  unchanged: number;
  errors: SyncResult[];
  results: SyncResult[];
}> {
  const pending = await prisma.fortisOnboarding.findMany({
    where: {
      mpaLink: { not: null },
      appStatus: { in: RECONCILABLE_STATUSES },
      ...(opts.organizationId ? { organizationId: opts.organizationId } : {}),
    },
    select: { organizationId: true },
    orderBy: { updatedAt: 'desc' },
    take: opts.limit ?? 200,
  });

  const results: SyncResult[] = [];
  if (pending.length === 0) {
    return { checked: 0, changed: [], unchanged: 0, errors: [], results };
  }

  // One Fortis users call for the whole run. If it fails, every organization
  // still gets its stored-webhook replay, then reports fortis_error — nobody
  // calls Fortis again (a hung Fortis must not eat the function's time budget
  // once per organization).
  let users: FortisUserRecord[] | undefined;
  let usersUnavailable: string | undefined;
  try {
    const client = createFortisClient();
    const listed = await client.listUsers();
    if (listed.status && listed.users) {
      users = listed.users;
    } else {
      usersUnavailable = `Fortis users list failed: ${listed.message || 'unknown error'}`;
    }
  } catch (err) {
    usersUnavailable = `Fortis client unavailable: ${(err as Error).message}`;
  }
  if (usersUnavailable) console.error('[Onboarding Sync]', usersUnavailable);

  const known = await knownMerchantLocationIds();
  const provisionBudget: ProvisionBudget = { remaining: MAX_PROVISIONS_PER_RUN };

  for (const row of pending) {
    try {
      const result = await syncOnboardingStatus(row.organizationId, {
        users,
        usersUnavailable,
        knownLocationIds: known,
        // after(): agency delivery retries must not eat the function's time budget.
        notify: 'after',
        provisionBudget,
        alertOnFailure: true,
      });
      results.push(result);
      if (result.locationId) known.add(result.locationId);
    } catch (err) {
      console.error(`[Onboarding Sync] Org ${row.organizationId} failed:`, err);
      results.push({
        organizationId: row.organizationId,
        previousStatus: null,
        status: null,
        changed: false,
        source: 'fortis_error',
        message: (err as Error).message,
      });
    }
  }

  return {
    checked: results.length,
    changed: results.filter((r) => r.changed),
    unchanged: results.filter((r) => !r.changed && r.source !== 'fortis_error').length,
    errors: results.filter((r) => r.source === 'fortis_error'),
    results,
  };
}

/**
 * 3. The merchant (or their agency) reports the MPA is signed and submitted.
 * BANK_INFORMATION_SENT → PENDING_REVIEW; anything else is left alone.
 * Returns the (possibly unchanged) status. Runs a sync afterwards so a merchant
 * who signed days ago and is already approved lands on the right state.
 */
export async function markApplicationSubmitted(
  organizationId: number,
  source: 'merchant' | 'agency' | 'admin',
  opts: Pick<SyncOptions, 'cooldownMs' | 'notify'> = {}
): Promise<SyncResult> {
  const org = await loadOnboarding(organizationId);
  if (!org || !org.fortisOnboarding) {
    return {
      organizationId,
      previousStatus: null,
      status: null,
      changed: false,
      source: 'no_onboarding',
      message: 'Organization or onboarding record not found',
    };
  }

  const onboarding = org.fortisOnboarding;
  const previousStatus = onboarding.appStatus;
  const notify = opts.notify ?? 'after';

  if (previousStatus === 'BANK_INFORMATION_SENT' && onboarding.mpaLink) {
    await prisma.fortisOnboarding.update({
      where: { id: onboarding.id },
      data: { appStatus: 'PENDING_REVIEW', updatedAt: new Date() },
    });
    console.log(`[Onboarding Sync] Org ${organizationId} → PENDING_REVIEW (submitted, reported by ${source})`);
    await deliverAgencyNotification(notify, () =>
      notifyAgencyOfStatusChange(org.userId, organizationId, 'PENDING_REVIEW', previousStatus)
    );
  }

  // Maybe Fortis already approved it — pick that up in the same call.
  const synced = await syncOnboardingStatus(organizationId, { cooldownMs: opts.cooldownMs, notify });
  if (synced.changed) return synced;

  const changed = previousStatus === 'BANK_INFORMATION_SENT' && synced.status === 'PENDING_REVIEW';
  return {
    ...synced,
    previousStatus,
    changed,
    source: changed ? synced.source : synced.source,
    message: changed
      ? 'Application marked as signed; Fortis underwriting in progress'
      : synced.message,
  };
}

/**
 * Manual completion: an operator pasted the merchant's API credentials from
 * the Fortis portal (the only other place they exist besides the webhook).
 */
export async function activateWithCredentials(
  organizationId: number,
  creds: ManualCredentials
): Promise<SyncResult> {
  const org = await loadOnboarding(organizationId);
  if (!org || !org.fortisOnboarding) {
    return {
      organizationId,
      previousStatus: null,
      status: null,
      changed: false,
      source: 'no_onboarding',
      message: 'Organization or onboarding record not found',
    };
  }
  if (org.fortisOnboarding.appStatus === 'ACTIVE') {
    // Already live: this is a credential rotation (e.g. someone pressed
    // "New Key" in the Fortis portal). Replace the credentials in place; no
    // status change and no agency webhook.
    const onboarding = org.fortisOnboarding;
    await prisma.fortisOnboarding.update({
      where: { id: onboarding.id },
      data: {
        authUserId: creds.authUserId,
        authUserApiKey: creds.authUserApiKey,
        locationId: creds.locationId ?? onboarding.locationId,
        productTransactionId: creds.productTransactionId ?? onboarding.productTransactionId,
        achProductTransactionId: creds.achProductTransactionId ?? onboarding.achProductTransactionId,
        updatedAt: new Date(),
      },
    });
    console.log(`[Onboarding Sync] Org ${organizationId}: credentials rotated on an ACTIVE record`);
    return {
      organizationId,
      previousStatus: 'ACTIVE',
      status: 'ACTIVE',
      changed: true,
      source: 'manual_credentials',
      message: 'Credentials replaced on an already ACTIVE record',
      locationId: creds.locationId ?? onboarding.locationId,
      hasCredentials: true,
    };
  }
  return activate(org, creds, 'manual_credentials', 'await');
}
