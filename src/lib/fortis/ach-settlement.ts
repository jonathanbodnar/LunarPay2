/**
 * ACH settlement tracking.
 *
 * An ACH debit is accepted by Fortis immediately and only clears (or comes
 * back) days later. This module is the ONE place that turns Fortis's view of
 * such a debit into LunarPay ledger state and merchant webhooks. Both callers
 * go through `reconcileAchTransaction`:
 *
 *   - the reconcile cron (src/app/api/cron/reconcile-ach) — the scheduler of
 *     record, since Fortis transaction postbacks are not registered for
 *     merchants;
 *   - the Fortis transaction webhook (src/lib/fortis/webhook-handler.ts) —
 *     which treats a postback only as "look at this transaction now" (and at
 *     most once a minute per transaction). The status is always re-read from
 *     Fortis with the merchant's own credentials, so a webhook and the cron
 *     can never disagree, and a forged post can at most trigger a re-check.
 *
 * Exactly-once per transition: the ledger write is conditional on the row
 * still holding the (status, status_ach) pair the decision was made from. The
 * caller whose write lands owns the transition — in the same database
 * transaction it adjusts the donor's running totals, counts a returned
 * renewal against its subscription, and queues the announcement in
 * webhook_outbox (lib/webhook-outbox.ts), which is re-sent until a 2xx.
 * Anyone racing it (cron vs webhook, two runs) sees zero rows updated.
 *
 * Who is told: only debits created through POST /api/v1/charges or a
 * subscription renewal, at or after ACH_CHARGE_EVENTS_SINCE (set at deploy).
 * Everything else — older rows, hosted checkout, payment links, dashboard
 * charges — has its status reconciled silently: those merchants never
 * received charge.* for those paths and do not start now.
 *
 * Events use the same sender, envelope, signing and data keys as POST
 * /api/v1/charges (lib/webhook.ts deliverWebhook → the organization's URL):
 *   charge.succeeded       — the debit settled (data.status 'paid')
 *   charge.failed          — returned (status 'returned'), voided ('voided') or
 *                            declined ('failed'); `error` carries the reason
 *                            ("ACH return R01: Insufficient funds"), `return_code` the code
 *   subscription.cancelled — a returned renewal cancelled its subscription
 *                            (same payload as the renewal cron's)
 *
 * No I/O of its own: everything goes through injected deps so the runtime
 * wiring (ach-settlement-runtime.ts) stays thin and this file stays testable.
 */

import type { PrismaClient } from '@prisma/client';
import { achReturnDescription, classifyAchTransaction, type AchOutcome } from '@/lib/fortis/ach-status';
import { dueOutboxIds, outboxRows, type OutboxEntryInput } from '@/lib/webhook-outbox';
import { acquireJobLock, releaseJobLock } from '@/lib/job-lock';

// ── Ledger vocabulary (epicpay_customer_transactions) ────────────────────────
//   status:      U pending · P paid · N failed · V voided · R refunded
//   status_ach:  W waiting · P processed (settled) · F failed
//                (older writers also leave NULL or 'pending' on a waiting debit)

const PENDING_STATUSES = ['U', 'P'] as const;
const PENDING_STATUS_ACH = ['W', 'pending'] as const;

// ── Scheduling knobs ─────────────────────────────────────────────────────────

/** A debit younger than this has not had time to move; don't ask Fortis yet. */
export const ACH_MIN_AGE_MS = 2 * 60 * 60 * 1000;
/** Re-check a waiting debit at most this often (the cron runs hourly). */
export const ACH_PENDING_RECHECK_MS = 110 * 60 * 1000;
/** Give up polling a debit that is still waiting after this long. */
export const ACH_PENDING_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;
/** Re-check a settled debit for a late return about once a day… */
export const ACH_SETTLED_RECHECK_MS = 20 * 60 * 60 * 1000;
/** …for this long after it was created (unauthorized returns — R05/R07/R10/R11/R29 —
 *  may arrive up to 60 days after settlement). */
export const ACH_SETTLED_WATCH_MS = 75 * 24 * 60 * 60 * 1000;
/** A webhook re-reads one transaction from Fortis at most this often. */
export const ACH_WEBHOOK_RECHECK_MS = 60 * 1000;
export const ACH_DEFAULT_LIMIT = 100;
export const ACH_DEFAULT_CONCURRENCY = 4;
/** Stop starting new Fortis reads after this long (the cron route has 60s). */
export const ACH_DEFAULT_TIME_BUDGET_MS = 45_000;
/** Undelivered announcements re-sent per run. */
export const ACH_OUTBOX_PER_RUN = 25;
export const ACH_RUN_LOCK = 'reconcile-ach';
export const ACH_RUN_LOCK_TTL_MS = 5 * 60 * 1000;

/** Same threshold as the renewal cron (process-subscriptions). */
export const MAX_CONSECUTIVE_FAILURES = 4;
/**
 * Returns after which a subscription must not be debited again: account
 * closed / missing / invalid (R02, R03, R04), authorization revoked or
 * payment stopped (R07, R08), unauthorized (R10, R29 — NACHA forbids
 * re-presenting), account frozen (R16), non-transaction account (R20).
 */
export const IMMEDIATE_CANCEL_RETURN_CODES: ReadonlySet<string> = new Set([
  'R02', 'R03', 'R04', 'R07', 'R08', 'R10', 'R16', 'R20', 'R29',
]);

/** Every Fortis transaction id on file is 24 hex characters; imported Stripe
 *  charges and legacy test rows carry other ids that must never be sent to Fortis. */
const FORTIS_ID_RE = /^[0-9a-f]{24}$/i;

// ── Types ────────────────────────────────────────────────────────────────────

export type AchDb = Pick<
  PrismaClient,
  '$transaction' | 'transaction' | 'donor' | 'organization' | 'source' | 'subscription' | 'webhookOutbox' | 'jobLock'
>;

/** The columns this module reads from a transaction row. */
export const ACH_TX_SELECT = {
  id: true,
  organizationId: true,
  donorId: true,
  status: true,
  statusAch: true,
  source: true,
  fortisTransactionId: true,
  totalAmount: true,
  subTotalAmount: true,
  fee: true,
  refundedAmount: true,
  givingSource: true,
  subscriptionId: true,
  createdAt: true,
  updatedAt: true,
} as const;

/** Decimal columns arrive as Prisma.Decimal; anything Number() can read is fine. */
type Money = number | string | { toString(): string };

export interface AchTxRow {
  id: bigint;
  organizationId: number;
  donorId: number;
  status: string;
  statusAch: string | null;
  source: string;
  fortisTransactionId: string | null;
  totalAmount: Money;
  subTotalAmount: Money;
  fee: Money;
  refundedAmount: Money | null;
  givingSource: string;
  subscriptionId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AchOrgContext {
  organizationId: number;
  fortisUserId: string;
  fortisApiKey: string;
  webhookUrl: string | null;
  webhookSecret: string | null;
}

export type FortisTxRecord = Record<string, unknown>;

export type FetchTransactionResult =
  | { ok: true; transaction: FortisTxRecord }
  | { ok: false; httpStatus?: number; message: string };

export type ChargeEventName = 'charge.succeeded' | 'charge.failed';

export interface AchReconcileDeps {
  db: AchDb;
  /** GET /v1/transactions/{id} with the merchant's own credentials. */
  fetchTransaction(org: AchOrgContext, fortisTransactionId: string): Promise<FetchTransactionResult>;
  /** Deliver freshly queued webhook_outbox rows (runtime: after(), never blocking). */
  dispatch(outboxIds: bigint[]): void | Promise<unknown>;
  /** Debits created at or after this instant (via POST /v1/charges or a renewal)
   *  are announced. null — the env var unset — announces nothing. */
  chargeEventsSince: Date | null;
  /** Optional audit trail (payment-logger). Must never throw. */
  logTransition?(entry: { tx: AchTxRow; transition: AchStateChange; origin: AchOrigin }): Promise<void>;
  now?: () => Date;
  /** A unique id for this run's lock lease. */
  runId?: () => string;
}

export type AchOrigin = 'cron' | 'webhook' | 'manual';

export interface DonorDelta {
  amount: number;
  fee: number;
  net: number;
  /** Set firstDate when the donor has none (a first gift just landed). */
  setFirstDate: boolean;
}

export interface AchStateChange {
  kind: 'settle' | 'fail';
  from: { status: string; statusAch: string | null };
  to: { status: string; statusAch: string };
  outcome: AchOutcome;
  donorDelta: DonorDelta | null;
  event: ChargeEventName;
}

export type AchTransition = AchStateChange | { kind: 'none'; outcome: AchOutcome };

export type AchWatchPhase = 'pending' | 'settled';

/** Which writer created the row — decides its donor accounting and whether
 *  its outcome is announced. */
export type AchChargePath = 'v1_charge' | 'subscription' | 'installment' | 'checkout' | 'other';

// ── Pure decisions ───────────────────────────────────────────────────────────

function money(value: Money | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = Number(typeof value === 'object' ? value.toString() : value);
  return Number.isFinite(n) ? n : 0;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function isFortisTransactionId(id: string | null | undefined): id is string {
  return !!id && FORTIS_ID_RE.test(id);
}

/** ACH_CHARGE_EVENTS_SINCE — an ISO timestamp; anything else disables events. */
export function parseChargeEventsSince(raw: string | undefined | null): Date | null {
  if (!raw || !raw.trim()) return null;
  const at = new Date(raw.trim());
  return Number.isNaN(at.getTime()) ? null : at;
}

/**
 * Is this row an ACH debit we still have something to learn about?
 *   pending — waiting to clear (U or P with status_ach NULL / W / 'pending')
 *   settled — cleared (P + status_ach P); watched a while longer for a late return
 *   null    — not ACH, already final (failed, voided, refunded), a foreign id,
 *             or a historical import (fortis_import, stripe_import): records,
 *             not LunarPay charges — never re-stated or announced.
 */
export function achWatchPhase(
  tx: Pick<AchTxRow, 'source' | 'status' | 'statusAch' | 'fortisTransactionId' | 'givingSource'>
): AchWatchPhase | null {
  if (tx.source !== 'BNK' || !isFortisTransactionId(tx.fortisTransactionId)) return null;
  if (tx.givingSource?.endsWith('_import')) return null;
  if (tx.statusAch === 'P') return tx.status === 'P' ? 'settled' : null;
  const waiting = tx.statusAch === null || (PENDING_STATUS_ACH as readonly string[]).includes(tx.statusAch);
  if (waiting && (PENDING_STATUSES as readonly string[]).includes(tx.status)) return 'pending';
  return null;
}

/**
 *  - subscription — a renewal (process-subscriptions; the only writer that sets
 *    subscription_id on a charge row);
 *  - v1_charge — POST /api/v1/charges: givingSource 'api' and always fee 0;
 *  - installment — process-scheduled-payments: also 'api', always with a fee;
 *  - checkout — hosted checkout;
 *  - other — payment links, dashboard charges, legacy writers.
 */
export function achChargePath(tx: Pick<AchTxRow, 'subscriptionId' | 'givingSource' | 'fee'>): AchChargePath {
  if (tx.subscriptionId != null) return 'subscription';
  if (tx.givingSource === 'api') return money(tx.fee) === 0 ? 'v1_charge' : 'installment';
  if (tx.givingSource === 'checkout') return 'checkout';
  return 'other';
}

/** Is this debit's outcome announced to the merchant? (See the file header.) */
export function announcesAchOutcome(
  tx: Pick<AchTxRow, 'subscriptionId' | 'givingSource' | 'fee' | 'createdAt'>,
  since: Date | null
): boolean {
  if (!since || tx.createdAt.getTime() < since.getTime()) return false;
  const path = achChargePath(tx);
  return path === 'v1_charge' || path === 'subscription';
}

/**
 * What the row's creation path already added to the donor's running totals
 * (account_donor.amount_acum / fee_acum / net_acum). The writers disagree on
 * whether a still-pending ACH debit counts, so this mirrors each of them:
 *
 *  - POST /api/v1/charges counts every captured charge at once — a pending ACH
 *    debit included — and only in amount_acum (its fee is always 0 and it
 *    never touches net_acum).
 *  - Hosted checkout counts a pending ACH debit in all three at creation.
 *  - Every writer that records an ACH debit as P (renewals, installments,
 *    dashboard charges — and this module when a debit settles) counted all three.
 *  - Anything else still pending (payment links) is counted when it settles.
 */
export function countedAtCreation(tx: AchTxRow): { amount: number; fee: number; net: number } | null {
  const total = money(tx.totalAmount);
  const fee = money(tx.fee);
  const net = money(tx.subTotalAmount);
  const path = achChargePath(tx);
  if (path === 'v1_charge') return { amount: total, fee: 0, net: 0 };
  if (path === 'checkout') return { amount: total, fee, net };
  if (tx.status === 'P') return { amount: total, fee, net };
  return null;
}

/** Totals to add when a debit settles: nothing if the creation path already
 *  counted it, otherwise the same increment the transaction-status webhook has
 *  always applied when a payment confirms. */
export function settleDonorDelta(tx: AchTxRow): DonorDelta | null {
  if (countedAtCreation(tx)) return null;
  return {
    amount: round2(money(tx.totalAmount)),
    fee: round2(money(tx.fee)),
    net: round2(money(tx.subTotalAmount)),
    setFirstDate: true,
  };
}

/** Totals to take back when a debit fails: whatever was counted, less what a
 *  refund already took out of amount_acum (the refund routes decrement it). */
export function failDonorDelta(tx: AchTxRow): DonorDelta | null {
  const counted = countedAtCreation(tx);
  if (!counted) return null;
  const amount = Math.max(0, round2(counted.amount - money(tx.refundedAmount)));
  if (amount === 0 && counted.fee === 0 && counted.net === 0) return null;
  const negate = (n: number) => (n === 0 ? 0 : -round2(n));
  return { amount: negate(amount), fee: negate(counted.fee), net: negate(counted.net), setFirstDate: false };
}

/**
 * Decide what (if anything) a Fortis outcome changes for this row. Never
 * moves a row backwards: failed/voided/refunded rows are not watched, and a
 * settled row can only go on to fail (a late return), never re-settle.
 */
export function planAchTransition(tx: AchTxRow, outcome: AchOutcome): AchTransition {
  const phase = achWatchPhase(tx);
  if (!phase) return { kind: 'none', outcome };
  const from = { status: tx.status, statusAch: tx.statusAch };

  if (outcome.kind === 'settled') {
    if (phase === 'settled') return { kind: 'none', outcome };
    return {
      kind: 'settle',
      from,
      to: { status: 'P', statusAch: 'P' },
      outcome,
      donorDelta: settleDonorDelta(tx),
      event: 'charge.succeeded',
    };
  }

  if (outcome.kind === 'failed') {
    return {
      kind: 'fail',
      from,
      to: { status: outcome.reason === 'voided' ? 'V' : 'N', statusAch: 'F' },
      outcome,
      donorDelta: failDonorDelta(tx),
      event: 'charge.failed',
    };
  }

  return { kind: 'none', outcome };
}

/** Same labels GET /api/v1/charges uses, so the event and a read-back agree. */
function chargeStatusLabel(status: string): string {
  switch (status) {
    case 'P': return 'paid';
    case 'N': return 'failed';
    case 'V': return 'voided';
    case 'R': return 'refunded';
    case 'U': return 'pending';
    default: return status;
  }
}

/** transaction_c1 is the caller's description on POST /api/v1/charges; the
 *  renewal and installment crons put a system reference there instead. */
export function chargeDescription(tx: AchTxRow, record: FortisTxRecord | null): string | null {
  const c1 = record?.transaction_c1;
  if (typeof c1 !== 'string' || !c1.trim()) return null;
  if (achChargePath(tx) !== 'v1_charge') return null;
  if (/^[A-Z]-\d+-\d+$/.test(c1.trim())) return null;
  return c1;
}

/**
 * The merchant webhook for a committed transition. Keys and order match what
 * POST /api/v1/charges sends for the same event; charge.failed additionally
 * carries `status` ('returned' | 'voided' | 'failed'), `return_code` and
 * `fortis_transaction_id`.
 */
export function chargeEventPayload(
  tx: AchTxRow,
  change: AchStateChange,
  context: { paymentMethodId: number | null; description: string | null },
): { event: ChargeEventName; data: Record<string, unknown> } {
  const base = {
    transaction_id: tx.id.toString(),
    customer_id: tx.donorId,
    payment_method_id: context.paymentMethodId,
    amount_cents: Math.round(money(tx.totalAmount) * 100),
    currency: 'USD',
    payment_method: 'ach',
  };

  if (change.kind === 'settle') {
    return {
      event: 'charge.succeeded',
      data: {
        ...base,
        status: chargeStatusLabel(change.to.status),
        captured: true,
        fortis_transaction_id: tx.fortisTransactionId,
        description: context.description,
      },
    };
  }

  const outcome = change.outcome;
  const failed = outcome.kind === 'failed' ? outcome : null;
  return {
    event: 'charge.failed',
    data: {
      ...base,
      status: failed?.reason === 'returned' ? 'returned' : chargeStatusLabel(change.to.status),
      error: failed ? failed.message : 'ACH debit failed',
      return_code: failed ? failed.returnCode : null,
      fortis_transaction_id: tx.fortisTransactionId,
      description: context.description,
    },
  };
}

// ── Writes ───────────────────────────────────────────────────────────────────

type TxClient = Parameters<Parameters<AchDb['$transaction']>[0]>[0];

export interface RenewalFailure {
  subscriptionId: number;
  consecutiveFailures: number;
  cancelled: boolean;
  /** Cancelled because the return code forbids another debit. */
  immediate: boolean;
  returnCode: string | null;
  donorId: number;
  email: string;
}

/**
 * A renewal that came back is a failed renewal: count it against the
 * subscription the way process-subscriptions counts a decline, and cancel at
 * MAX_CONSECUTIVE_FAILURES — or at once for a return that forbids another
 * debit. The renewal cron resets its counter whenever the bank merely
 * ACCEPTS a debit, which an ACH return arrives days after, so the streak is
 * also read from the subscription's own recent charges (newest first,
 * skipping debits whose outcome is still unknown).
 */
async function recordRenewalFailure(t: TxClient, tx: AchTxRow, change: AchStateChange, now: Date): Promise<RenewalFailure | null> {
  if (tx.subscriptionId == null) return null;
  const sub = await t.subscription.findUnique({
    where: { id: tx.subscriptionId },
    select: { id: true, status: true, consecutiveFailures: true, donorId: true, email: true },
  });
  if (!sub) return null;

  const history = await t.transaction.findMany({
    where: { subscriptionId: sub.id },
    orderBy: { createdAt: 'desc' },
    take: 12,
    select: { id: true, status: true, statusAch: true, source: true, fortisTransactionId: true, givingSource: true },
  });
  let streak = 0;
  for (const row of history) {
    if (row.status === 'N') {
      streak++;
      continue;
    }
    if (achWatchPhase(row) === 'pending') continue; // outcome not known yet
    break; // a charge that went through ends the streak
  }
  const consecutiveFailures = Math.max((sub.consecutiveFailures ?? 0) + 1, streak);
  const returnCode = change.outcome.kind === 'failed' ? change.outcome.returnCode : null;
  const immediate = !!returnCode && IMMEDIATE_CANCEL_RETURN_CODES.has(returnCode);

  await t.subscription.updateMany({
    where: { id: sub.id },
    data: { failTrxns: { increment: 1 }, consecutiveFailures },
  });
  let cancelled = false;
  if (immediate || consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
    const flipped = await t.subscription.updateMany({
      where: { id: sub.id, status: 'A' },
      data: { status: 'D', cancelledAt: now },
    });
    cancelled = flipped.count === 1;
  }
  return { subscriptionId: sub.id, consecutiveFailures, cancelled, immediate, returnCode, donorId: sub.donorId, email: sub.email };
}

/** The renewal cron's subscription.cancelled payload, for a return. */
export function subscriptionCancelledPayload(failure: RenewalFailure): Record<string, unknown> {
  const description = achReturnDescription(failure.returnCode);
  return {
    subscription_id: failure.subscriptionId,
    customer_id: failure.donorId,
    customer_email: failure.email,
    reason: failure.immediate
      ? `Auto-cancelled after ACH return ${failure.returnCode}${description ? ` (${description})` : ''}`
      : `Auto-cancelled after ${failure.consecutiveFailures} consecutive payment failures`,
    consecutive_failures: failure.consecutiveFailures,
  };
}

export interface CommitResult {
  won: boolean;
  outboxIds: bigint[];
  renewal: RenewalFailure | null;
}

/**
 * Apply a planned transition if — and only if — the row still holds the state
 * it was planned from. Donor totals, renewal accounting and the outbox rows
 * all land in the same database transaction.
 */
export async function commitAchTransition(
  db: AchDb,
  tx: AchTxRow,
  change: AchStateChange,
  fortisRecord: FortisTxRecord,
  now: Date,
  announce: { events: OutboxEntryInput[]; subscriptionCancelled: boolean } = { events: [], subscriptionCancelled: false },
): Promise<CommitResult> {
  return db.$transaction(async (t) => {
    const claimed = await t.transaction.updateMany({
      where: { id: tx.id, status: change.from.status, statusAch: change.from.statusAch },
      data: {
        status: change.to.status,
        statusAch: change.to.statusAch,
        requestResponse: JSON.stringify(fortisRecord),
        updatedAt: now,
      },
    });
    if (claimed.count !== 1) return { won: false, outboxIds: [], renewal: null };

    const delta = change.donorDelta;
    if (delta && tx.donorId) {
      // updateMany: a guest row (donorId 0) or a since-deleted donor must not
      // throw and roll the status change back.
      await t.donor.updateMany({
        where: { id: tx.donorId },
        data: {
          amountAcum: { increment: delta.amount },
          feeAcum: { increment: delta.fee },
          netAcum: { increment: delta.net },
        },
      });
      if (delta.setFirstDate) {
        await t.donor.updateMany({ where: { id: tx.donorId, firstDate: null }, data: { firstDate: now } });
      }
    }

    const renewal = change.kind === 'fail' ? await recordRenewalFailure(t, tx, change, now) : null;

    const entries = [...announce.events];
    if (renewal?.cancelled && announce.subscriptionCancelled) {
      entries.push({
        organizationId: tx.organizationId,
        transactionId: tx.id,
        event: 'subscription.cancelled',
        data: subscriptionCancelledPayload(renewal),
        dedupeKey: `subscription.cancelled:${renewal.subscriptionId}:${tx.id}`,
      });
    }
    if (change.kind === 'fail') {
      // A "succeeded" still waiting to be re-sent must not land after the failure.
      await t.webhookOutbox.updateMany({
        where: { transactionId: tx.id, event: 'charge.succeeded', status: 'pending' },
        data: { status: 'superseded' },
      });
    }

    let outboxIds: bigint[] = [];
    if (entries.length) {
      const created = await t.webhookOutbox.createManyAndReturn({
        data: outboxRows(entries, now),
        skipDuplicates: true,
        select: { id: true },
      });
      outboxIds = created.map((r) => r.id);
    }
    return { won: true, outboxIds, renewal };
  });
}

/** Record that a row was checked with nothing new, so the next run starts with
 *  the rows checked longest ago. Conditional, so it can never undo a transition. */
async function touchChecked(db: AchDb, tx: AchTxRow, now: Date): Promise<void> {
  await db.transaction.updateMany({
    where: { id: tx.id, status: tx.status, statusAch: tx.statusAch },
    data: { updatedAt: now },
  });
}

// ── Orchestration ────────────────────────────────────────────────────────────

export type AchReconcileOutcome =
  | 'transitioned'
  | 'would_transition'
  | 'lost_race'
  | 'unchanged'
  | 'throttled'
  | 'not_watchable'
  | 'no_credentials'
  | 'fortis_error';

export interface AchReconcileResult {
  transactionId: string;
  organizationId: number;
  outcome: AchReconcileOutcome;
  /** Fortis classification, when Fortis was read. */
  ach?: AchOutcome['kind'];
  statusCode?: number | null;
  from?: { status: string; statusAch: string | null };
  to?: { status: string; statusAch: string };
  event?: ChargeEventName;
  /** Whether the merchant is (or, in a dry run, would be) told. */
  announced?: boolean;
  returnCode?: string | null;
  subscriptionCancelled?: boolean;
  message?: string;
}

type OrgCache = Map<number, Promise<AchOrgContext | null>>;

/** The merchant's own Fortis credentials and webhook config, or null when
 *  there are none to read the transaction with. */
export async function loadAchOrgContext(db: AchDb, organizationId: number): Promise<AchOrgContext | null> {
  const org = await db.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      webhookUrl: true,
      webhookSecret: true,
      fortisOnboarding: { select: { authUserId: true, authUserApiKey: true } },
    },
  });
  const userId = org?.fortisOnboarding?.authUserId?.trim();
  const apiKey = org?.fortisOnboarding?.authUserApiKey?.trim();
  // A PROVISIONING:<ms> claim token is not a key (lib/fortis/onboarding-sync.ts).
  if (!org || !userId || !apiKey || apiKey.startsWith('PROVISIONING:')) return null;
  return {
    organizationId: org.id,
    fortisUserId: userId,
    fortisApiKey: apiKey,
    webhookUrl: org.webhookUrl,
    webhookSecret: org.webhookSecret,
  };
}

async function resolvePaymentMethodId(db: AchDb, tx: AchTxRow, record: FortisTxRecord): Promise<number | null> {
  const token = record.token_id ?? record.account_vault_id;
  if (typeof token !== 'string' || !token) return null;
  try {
    const source = await db.source.findFirst({
      where: { organizationId: tx.organizationId, donorId: tx.donorId, fortisWalletId: token },
      select: { id: true },
      orderBy: { id: 'desc' },
    });
    return source?.id ?? null;
  } catch {
    return null;
  }
}

function clock(deps: AchReconcileDeps): Date {
  return deps.now ? deps.now() : new Date();
}

/**
 * Check one ACH transaction against Fortis and apply whatever changed.
 * Never throws for Fortis or delivery trouble; the row is simply left for the
 * next run. `dryRun` reads Fortis and reports, but writes and sends nothing.
 */
export async function reconcileAchTransaction(
  deps: AchReconcileDeps,
  tx: AchTxRow,
  opts: { origin: AchOrigin; dryRun?: boolean; orgCache?: OrgCache } = { origin: 'manual' },
): Promise<AchReconcileResult> {
  const now = clock(deps);
  const base = { transactionId: tx.id.toString(), organizationId: tx.organizationId };

  if (!achWatchPhase(tx)) {
    // e.g. a non-Fortis id the queue query cannot exclude: rotate it out of
    // the head of the queue instead of letting it win every run.
    if (opts.origin === 'cron' && !opts.dryRun) await touchChecked(deps.db, tx, now);
    return { ...base, outcome: 'not_watchable' };
  }

  const cache = opts.orgCache;
  let orgPromise = cache?.get(tx.organizationId);
  if (!orgPromise) {
    orgPromise = loadAchOrgContext(deps.db, tx.organizationId);
    cache?.set(tx.organizationId, orgPromise);
  }
  const org = await orgPromise;
  if (!org) {
    if (!opts.dryRun) await touchChecked(deps.db, tx, now);
    return { ...base, outcome: 'no_credentials', message: 'No Fortis credentials on file for this merchant' };
  }

  const fetched = await deps.fetchTransaction(org, tx.fortisTransactionId as string);
  if (!fetched.ok) {
    if (!opts.dryRun) await touchChecked(deps.db, tx, now);
    return {
      ...base,
      outcome: 'fortis_error',
      message: `${fetched.httpStatus ? `HTTP ${fetched.httpStatus}: ` : ''}${fetched.message}`.slice(0, 300),
    };
  }

  const record = fetched.transaction;
  const outcome = classifyAchTransaction(record);
  const statusCode = outcome.statusCode;
  const transition = planAchTransition(tx, outcome);

  if (transition.kind === 'none') {
    if (!opts.dryRun) await touchChecked(deps.db, tx, now);
    return { ...base, outcome: 'unchanged', ach: outcome.kind, statusCode };
  }

  const announced = !!org.webhookUrl && announcesAchOutcome(tx, deps.chargeEventsSince);
  const summary = {
    ach: outcome.kind,
    statusCode,
    from: transition.from,
    to: transition.to,
    event: transition.event,
    announced,
    returnCode: outcome.kind === 'failed' ? outcome.returnCode : null,
    ...(outcome.kind === 'failed' ? { message: outcome.message } : {}),
  };

  if (opts.dryRun) return { ...base, outcome: 'would_transition', ...summary };

  const events: OutboxEntryInput[] = [];
  if (announced) {
    const { event, data } = chargeEventPayload(tx, transition, {
      paymentMethodId: await resolvePaymentMethodId(deps.db, tx, record),
      description: chargeDescription(tx, record),
    });
    events.push({ organizationId: tx.organizationId, transactionId: tx.id, event, data, dedupeKey: `${event}:${tx.id}` });
  }

  const committed = await commitAchTransition(deps.db, tx, transition, record, now, {
    events,
    subscriptionCancelled: announced,
  });
  if (!committed.won) return { ...base, outcome: 'lost_race', ...summary };

  // Committed and queued: delivery failures are retried from webhook_outbox.
  if (committed.outboxIds.length) {
    try {
      await deps.dispatch(committed.outboxIds);
    } catch (err) {
      console.error(`[ACH] Transaction ${tx.id}: delivery not started; the outbox will retry:`, err);
    }
  }
  if (deps.logTransition) {
    try {
      await deps.logTransition({ tx, transition, origin: opts.origin });
    } catch {
      /* audit is best-effort */
    }
  }
  return {
    ...base,
    outcome: 'transitioned',
    ...summary,
    ...(committed.renewal ? { subscriptionCancelled: committed.renewal.cancelled } : {}),
  };
}

export interface AchReconcileOptions {
  limit?: number;
  organizationId?: number;
  dryRun?: boolean;
  concurrency?: number;
  timeBudgetMs?: number;
}

export interface AchReconcileSummary {
  dryRun: boolean;
  /** False when another run held the lock; nothing was read or written. */
  ran: boolean;
  /** Undelivered announcements found due and handed to the sender. */
  outboxRetried: number;
  selected: number;
  checked: number;
  /** Selected but not started because the time budget ran out — next run. */
  deferred: number;
  transitioned: AchReconcileResult[];
  unchanged: number;
  skipped: AchReconcileResult[];
  errors: AchReconcileResult[];
}

function ago(now: Date, ms: number): Date {
  return new Date(now.getTime() - ms);
}

/** Rows waiting to clear, oldest-checked first. */
export function pendingAchWhere(now: Date, organizationId?: number) {
  return {
    source: 'BNK',
    fortisTransactionId: { not: null },
    status: { in: [...PENDING_STATUSES] },
    OR: [{ statusAch: null }, { statusAch: { in: [...PENDING_STATUS_ACH] } }],
    // Historical imports (fortis_import, stripe_import) are records, not
    // LunarPay charges: never poll them or announce them.
    NOT: { givingSource: { endsWith: '_import' } },
    createdAt: { lte: ago(now, ACH_MIN_AGE_MS), gte: ago(now, ACH_PENDING_MAX_AGE_MS) },
    updatedAt: { lte: ago(now, ACH_PENDING_RECHECK_MS) },
    ...(organizationId ? { organizationId } : {}),
  };
}

/** Settled rows still inside the return window, checked about daily. */
export function settledAchWhere(now: Date, organizationId?: number) {
  return {
    source: 'BNK',
    fortisTransactionId: { not: null },
    status: 'P',
    statusAch: 'P',
    NOT: { givingSource: { endsWith: '_import' } },
    createdAt: { gte: ago(now, ACH_SETTLED_WATCH_MS) },
    updatedAt: { lte: ago(now, ACH_SETTLED_RECHECK_MS) },
    ...(organizationId ? { organizationId } : {}),
  };
}

function newRunId(): string {
  const uuid = (globalThis.crypto as { randomUUID?: () => string } | undefined)?.randomUUID?.();
  return uuid ?? `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * One bounded reconcile pass, under a run lock (so pg_cron and the Railway
 * backstop can never overlap): re-send undelivered announcements, then check
 * waiting debits first and settled debits still inside the return window,
 * at most `limit` Fortis reads in total, never starting a read after the time
 * budget. Idempotent — a second pass over the same Fortis state changes
 * nothing and sends nothing.
 */
export async function runAchReconcile(
  deps: AchReconcileDeps,
  opts: AchReconcileOptions = {},
): Promise<AchReconcileSummary> {
  const now = clock(deps);
  const summary: AchReconcileSummary = {
    dryRun: !!opts.dryRun,
    ran: false,
    outboxRetried: 0,
    selected: 0,
    checked: 0,
    deferred: 0,
    transitioned: [],
    unchanged: 0,
    skipped: [],
    errors: [],
  };

  const holder = deps.runId ? deps.runId() : newRunId();
  if (!(await acquireJobLock(deps.db, ACH_RUN_LOCK, holder, ACH_RUN_LOCK_TTL_MS, now))) return summary;
  summary.ran = true;

  try {
    // 1. Announcements that never got a 2xx.
    const due = await dueOutboxIds(deps.db, now, ACH_OUTBOX_PER_RUN);
    summary.outboxRetried = due.length;
    if (due.length && !opts.dryRun) {
      try {
        await deps.dispatch(due);
      } catch (err) {
        console.error('[ACH] Outbox re-send not started:', err);
      }
    }

    // 2. Fortis reads.
    const limit = Math.max(1, Math.min(opts.limit ?? ACH_DEFAULT_LIMIT, 500));
    const concurrency = Math.max(1, Math.min(opts.concurrency ?? ACH_DEFAULT_CONCURRENCY, 8));
    const deadline = Date.now() + (opts.timeBudgetMs ?? ACH_DEFAULT_TIME_BUDGET_MS);

    const pending = (await deps.db.transaction.findMany({
      where: pendingAchWhere(now, opts.organizationId),
      orderBy: { updatedAt: 'asc' },
      take: limit,
      select: ACH_TX_SELECT,
    })) as AchTxRow[];
    const settled =
      pending.length < limit
        ? ((await deps.db.transaction.findMany({
            where: settledAchWhere(now, opts.organizationId),
            orderBy: { updatedAt: 'asc' },
            take: limit - pending.length,
            select: ACH_TX_SELECT,
          })) as AchTxRow[])
        : [];
    const queue = [...pending, ...settled];
    summary.selected = queue.length;
    const orgCache: OrgCache = new Map();

    let next = 0;
    const worker = async () => {
      while (next < queue.length) {
        if (Date.now() > deadline) return;
        const tx = queue[next++];
        let result: AchReconcileResult;
        try {
          result = await reconcileAchTransaction(deps, tx, { origin: 'cron', dryRun: opts.dryRun, orgCache });
        } catch (err) {
          result = {
            transactionId: tx.id.toString(),
            organizationId: tx.organizationId,
            outcome: 'fortis_error',
            message: String((err as Error)?.message ?? err).slice(0, 300),
          };
        }
        summary.checked++;
        if (result.outcome === 'transitioned' || result.outcome === 'would_transition') summary.transitioned.push(result);
        else if (result.outcome === 'unchanged' || result.outcome === 'lost_race') summary.unchanged++;
        else if (result.outcome === 'fortis_error') summary.errors.push(result);
        else summary.skipped.push(result);
      }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, worker));
    summary.deferred = queue.length - summary.checked;
    return summary;
  } finally {
    try {
      await releaseJobLock(deps.db, ACH_RUN_LOCK, holder);
    } catch (err) {
      console.error('[ACH] Could not release the run lock (it expires on its own):', err);
    }
  }
}

/**
 * Webhook entry point: a Fortis postback named a transaction; re-read it from
 * Fortis and apply the result exactly as the cron would — at most once per
 * ACH_WEBHOOK_RECHECK_MS per transaction, so posts to the unauthenticated
 * legacy URL cannot be used to drive Fortis reads. Returns null when the row
 * is not an ACH debit this module tracks.
 */
export async function reconcileAchTransactionById(
  deps: AchReconcileDeps,
  transactionId: bigint,
  origin: AchOrigin,
): Promise<AchReconcileResult | null> {
  const tx = (await deps.db.transaction.findUnique({
    where: { id: transactionId },
    select: ACH_TX_SELECT,
  })) as AchTxRow | null;
  if (!tx || tx.source !== 'BNK') return null;
  if (origin === 'webhook' && clock(deps).getTime() - tx.updatedAt.getTime() < ACH_WEBHOOK_RECHECK_MS) {
    return { transactionId: tx.id.toString(), organizationId: tx.organizationId, outcome: 'throttled' };
  }
  return reconcileAchTransaction(deps, tx, { origin });
}
