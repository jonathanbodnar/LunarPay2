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
      user: { select: { email: true, agencyId: true } },
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

  await prisma.fortisOnboarding.update({
    where: { id: onboarding.id },
    data: {
      authUserId: creds.authUserId,
      authUserApiKey: creds.authUserApiKey,
      locationId: creds.locationId ?? onboarding.locationId,
      productTransactionId: creds.productTransactionId ?? onboarding.productTransactionId,
      achProductTransactionId: creds.achProductTransactionId ?? onboarding.achProductTransactionId,
      appStatus: 'ACTIVE',
      ...(processorResponse ? { processorResponse } : {}),
      updatedAt: new Date(),
    },
  });

  console.log(`[Onboarding Sync] Org ${org.id} → ACTIVE via ${source}`);

  // The approval signal agencies depend on. Deferred (or awaited by the cron)
  // so the retry backoff survives the caller's response.
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
    locationId: creds.locationId ?? onboarding.locationId,
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
      return activate(
        org,
        {
          authUserId: creds.userId,
          authUserApiKey: creds.userApiKey,
          locationId: creds.locationId,
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
 * 2. Detect approval through GET /v1/users.
 *
 * Only a name+domain match is allowed to change the record. A domain-only
 * match (private domain, unique in our database, but the legal name on the
 * Fortis user doesn't line up) is reported to ops as a hint and NOT written —
 * mis-assigning another merchant's location is far worse than a delayed
 * approval, which the webhook resolves anyway.
 */
async function detectApprovalViaUsers(
  org: LoadedOrg,
  users: FortisUserRecord[],
  knownLocationIds: Set<string>
): Promise<SyncResult | null> {
  const onboarding = org.fortisOnboarding!;
  if (onboarding.appStatus === 'APPROVED' && onboarding.locationId) {
    return null; // already detected; still waiting for the webhook
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
    await sendOpsAlert(org, match);
    return null;
  }

  const previousStatus = onboarding.appStatus;
  await prisma.fortisOnboarding.update({
    where: { id: onboarding.id },
    data: {
      appStatus: 'APPROVED',
      locationId: match.locationId,
      authUserId: match.user.id,
      updatedAt: new Date(),
    },
  });

  console.warn(
    `[Onboarding Sync] Org ${org.id} approved at Fortis (user ${match.user.username}, location ${match.locationId}, match=${match.confidence}) but no credentials webhook has arrived`
  );

  await sendOpsAlert(org, match);

  return {
    organizationId: org.id,
    previousStatus,
    status: 'APPROVED',
    changed: true,
    source: 'fortis_users',
    message: `Fortis provisioned location ${match.locationId} (API user ${match.user.username}); awaiting credentials webhook`,
    locationId: match.locationId,
    hasCredentials: false,
  };
}

async function sendOpsAlert(org: LoadedOrg, match: ApprovalMatch): Promise<void> {
  const to = process.env.ADMIN_EMAIL || process.env.ONBOARDING_ALERT_EMAIL;
  if (!to) return;
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://app.lunarpay.com';
    const confirmed = match.confidence === 'name+domain';
    const headline = confirmed
      ? `Fortis has provisioned a merchant account for organization ${org.id} (${org.name}); the record is now APPROVED.`
      : `A Fortis user on organization ${org.id} (${org.name})'s email domain appeared, but its name does not match the legal/DBA name, so NOTHING was written. Please verify in the Fortis portal that this location really belongs to this merchant.`;
    const curl = `curl -X POST "${appUrl}/api/admin/recover-status?admin_key=$CRON_ADMIN_KEY" -H "Content-Type: application/json" -d '{"organizationId": ${org.id}, "authUserId": "${match.user.id}", "locationId": "${match.locationId}", "authUserApiKey": "<key from the Fortis portal>"}'`;
    await sendEmail({
      to,
      subject: confirmed
        ? `[LunarPay] Fortis approved org ${org.id} (${org.name}) but no credentials webhook arrived`
        : `[LunarPay] Possible Fortis approval for org ${org.id} (${org.name}) — needs a human look`,
      category: 'transactional',
      text: [
        headline,
        `Fortis API user: ${match.user.username} (${match.user.id})`,
        `Fortis location: ${match.locationId}`,
        `Match confidence: ${match.confidence}`,
        '',
        'The onboarding webhook that carries the user_api_key has not reached LunarPay,',
        'so the merchant cannot process yet.',
        '',
        'Fix: confirm the onboarding postback URL for this agent/template in the Fortis portal',
        `(${appUrl}/fortiswebhooks/merchant_account_status_listener) and ask Fortis to resend it,`,
        "or copy the API user's key from the Fortis portal and complete the record manually",
        '(auth: ?admin_key=$CRON_ADMIN_KEY or Authorization: Bearer $CRON_SECRET):',
        curl,
      ].join('\n'),
      html: [
        `<p>${escapeHtml(headline)}</p>`,
        `<ul><li>Fortis API user: <code>${escapeHtml(match.user.username)}</code> (${match.user.id})</li>`,
        `<li>Fortis location: <code>${match.locationId}</code></li>`,
        `<li>Match confidence: ${match.confidence}</li></ul>`,
        `<p>The onboarding webhook that carries the <code>user_api_key</code> has not reached LunarPay, so the merchant cannot process yet.</p>`,
        `<p>Fix: confirm the onboarding postback URL for this agent/template in the Fortis portal (<code>${appUrl}/fortiswebhooks/merchant_account_status_listener</code>) and ask Fortis to resend it, or copy the API user's key from the Fortis portal and complete the record manually (auth: <code>?admin_key=$CRON_ADMIN_KEY</code> or <code>Authorization: Bearer $CRON_SECRET</code>):</p>`,
        `<pre>${escapeHtml(curl)}</pre>`,
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
   * retry backoff runs; the cron passes 'await'.
   */
  notify?: NotifyMode;
}

/** Per-instance memory of the last Fortis users lookup per organization. */
const lastFortisCheckAt = new Map<number, number>();

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
      hasCredentials: !!onboarding.authUserApiKey,
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
            ? 'Approved at Fortis; still waiting for the credentials webhook'
            : 'Checked with Fortis a moment ago — no update yet',
        locationId: onboarding.locationId,
        hasCredentials: !!onboarding.authUserApiKey,
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
  const approved = await detectApprovalViaUsers(org, users, known);
  if (approved) return approved;

  return {
    organizationId,
    previousStatus: status,
    status,
    changed: false,
    source: 'no_change',
    message:
      status === 'APPROVED'
        ? 'Approved at Fortis; still waiting for the credentials webhook'
        : 'No approval visible at Fortis yet',
    locationId: onboarding.locationId,
    hasCredentials: !!onboarding.authUserApiKey,
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

  for (const row of pending) {
    try {
      const result = await syncOnboardingStatus(row.organizationId, {
        users,
        usersUnavailable,
        knownLocationIds: known,
        notify: 'await',
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
    return {
      organizationId,
      previousStatus: 'ACTIVE',
      status: 'ACTIVE',
      changed: false,
      source: 'already_terminal',
      message: 'Already ACTIVE',
      locationId: org.fortisOnboarding.locationId,
      hasCredentials: true,
    };
  }
  return activate(org, creds, 'manual_credentials', 'await');
}
