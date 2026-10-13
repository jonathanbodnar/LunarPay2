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
 *     which treats a postback only as "look at this transaction now". The
 *     status is always re-read from Fortis with the merchant's own
 *     credentials, so a webhook and the cron can never disagree, and an
 *     unsigned or forged post can at most trigger a harmless re-check.
 *
 * Exactly-once per transition: the ledger write is conditional on the row
 * still holding the (status, status_ach) pair the decision was made from. The
 * caller whose write lands owns the transition — it alone adjusts the donor's
 * running totals (in the same database transaction) and sends the event.
 * Anyone racing it (cron vs webhook, two overlapping cron runs) sees zero rows
 * updated and does nothing.
 *
 * Events use the same sender, envelope and signing as POST /api/v1/charges
 * (lib/webhook.ts deliverWebhook → the organization's webhook URL):
 *   charge.succeeded — the debit settled (data.status 'paid')
 *   charge.failed    — it was returned, voided or declined; `error` carries
 *                      the reason and `return_code` the NACHA code (R01…).
 *
 * No I/O of its own: everything goes through injected deps so the runtime
 * wiring (ach-settlement-runtime.ts) stays thin and this file stays testable.
 */

import type { PrismaClient } from '@prisma/client';
import { classifyAchTransaction, type AchOutcome } from '@/lib/fortis/ach-status';

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
export const ACH_DEFAULT_LIMIT = 100;
export const ACH_DEFAULT_CONCURRENCY = 4;
/** Stop starting new Fortis reads after this long (the cron route has 60s). */
export const ACH_DEFAULT_TIME_BUDGET_MS = 45_000;

/** Every Fortis transaction id on file is 24 hex characters; imported Stripe
 *  charges and legacy test rows carry other ids that must never be sent to Fortis. */
const FORTIS_ID_RE = /^[0-9a-f]{24}$/i;

// ── Types ────────────────────────────────────────────────────────────────────

export type AchDb = Pick<PrismaClient, '$transaction' | 'transaction' | 'donor' | 'organization' | 'source'>;

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
  /** Send a merchant webhook. May defer (after()) — the transition is already committed. */
  deliver(org: AchOrgContext, event: ChargeEventName, data: Record<string, unknown>): void | Promise<unknown>;
  /** Optional audit trail (payment-logger). Must never throw. */
  logTransition?(entry: {
    tx: AchTxRow;
    transition: AchStateChange;
    origin: AchOrigin;
  }): Promise<void>;
  now?: () => Date;
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

/**
 * Is this row an ACH debit we still have something to learn about?
 *   pending — waiting to clear (U or P with status_ach NULL / W / 'pending')
 *   settled — cleared (P + status_ach P); watched a while longer for a late return
 *   null    — not ACH, already final (failed, voided, refunded), or a historical
 *             import (fortis_import, stripe_import): records, not LunarPay
 *             charges — never re-stated or announced, by the cron or a webhook.
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
 * What the row's creation path already added to the donor's running totals
 * (account_donor.amount_acum / fee_acum / net_acum). The writers disagree on
 * whether a still-pending ACH debit counts, so this mirrors each of them:
 *
 *  - POST /api/v1/charges counts every captured charge at once — a pending ACH
 *    debit included — and only in amount_acum (its fee is always 0 and it
 *    never touches net_acum). Installments (process-scheduled-payments) are
 *    also givingSource 'api' but always carry a fee; recurring charges carry a
 *    subscription id.
 *  - Hosted checkout (givingSource 'checkout') counts a pending ACH debit in
 *    all three at creation.
 *  - Every writer that records an ACH debit as P (recurring, installments,
 *    dashboard charges — and this module when a debit settles) counted all three.
 *  - Anything else still pending (payment links) is counted when it settles.
 */
export function countedAtCreation(tx: AchTxRow): { amount: number; fee: number; net: number } | null {
  const total = money(tx.totalAmount);
  const fee = money(tx.fee);
  const net = money(tx.subTotalAmount);
  if (tx.givingSource === 'api' && tx.subscriptionId == null && fee === 0) {
    return { amount: total, fee: 0, net: 0 };
  }
  if (tx.givingSource === 'checkout') return { amount: total, fee, net };
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
 *  recurring and installment crons put a system reference there instead. */
export function chargeDescription(tx: AchTxRow, record: FortisTxRecord | null): string | null {
  const c1 = record?.transaction_c1;
  if (typeof c1 !== 'string' || !c1.trim()) return null;
  if (tx.givingSource !== 'api' || tx.subscriptionId != null) return null;
  if (/^[A-Z]-\d+-\d+$/.test(c1.trim())) return null;
  return c1;
}

/**
 * The merchant webhook for a committed transition. Keys and order match what
 * POST /api/v1/charges sends for the same event; charge.failed additionally
 * carries `status`, `return_code` and `fortis_transaction_id` (Aligned reads
 * status and fortis_transaction_id on every charge event).
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
  return {
    event: 'charge.failed',
    data: {
      ...base,
      status: chargeStatusLabel(change.to.status),
      error: outcome.kind === 'failed' ? outcome.message : 'ACH debit failed',
      return_code: outcome.kind === 'failed' ? outcome.returnCode : null,
      fortis_transaction_id: tx.fortisTransactionId,
      description: context.description,
    },
  };
}

// ── Writes ───────────────────────────────────────────────────────────────────

/**
 * Apply a planned transition if — and only if — the row still holds the state
 * it was planned from. Donor totals move in the same database transaction.
 * Returns true when this call owns the transition (and must send the event).
 */
export async function commitAchTransition(
  db: AchDb,
  tx: AchTxRow,
  change: AchStateChange,
  fortisRecord: FortisTxRecord,
  now: Date,
): Promise<boolean> {
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
    if (claimed.count !== 1) return false;

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
    return true;
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
  returnCode?: string | null;
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
  const now = deps.now ? deps.now() : new Date();
  const base = { transactionId: tx.id.toString(), organizationId: tx.organizationId };

  if (!achWatchPhase(tx)) return { ...base, outcome: 'not_watchable' };

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

  const summary = {
    ach: outcome.kind,
    statusCode,
    from: transition.from,
    to: transition.to,
    event: transition.event,
    returnCode: outcome.kind === 'failed' ? outcome.returnCode : null,
    ...(outcome.kind === 'failed' ? { message: outcome.message } : {}),
  };

  if (opts.dryRun) return { ...base, outcome: 'would_transition', ...summary };

  const won = await commitAchTransition(deps.db, tx, transition, record, now);
  if (!won) return { ...base, outcome: 'lost_race', ...summary };

  // Committed: this caller alone announces it.
  try {
    const paymentMethodId = await resolvePaymentMethodId(deps.db, tx, record);
    const { event, data } = chargeEventPayload(tx, transition, {
      paymentMethodId,
      description: chargeDescription(tx, record),
    });
    await deps.deliver(org, event, data);
  } catch (err) {
    console.error(`[ACH] Transaction ${tx.id} ${transition.event} delivery could not be queued:`, err);
  }
  if (deps.logTransition) {
    try {
      await deps.logTransition({ tx, transition, origin: opts.origin });
    } catch {
      /* audit is best-effort */
    }
  }
  return { ...base, outcome: 'transitioned', ...summary };
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

/**
 * One bounded reconcile pass: waiting debits first, then settled debits still
 * inside the return window, at most `limit` Fortis reads in total, never
 * starting a read after the time budget. Idempotent — a second pass over the
 * same Fortis state changes nothing and sends nothing.
 */
export async function runAchReconcile(
  deps: AchReconcileDeps,
  opts: AchReconcileOptions = {},
): Promise<AchReconcileSummary> {
  const now = deps.now ? deps.now() : new Date();
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

  const summary: AchReconcileSummary = {
    dryRun: !!opts.dryRun,
    selected: queue.length,
    checked: 0,
    deferred: 0,
    transitioned: [],
    unchanged: 0,
    skipped: [],
    errors: [],
  };
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
}

/**
 * Webhook entry point: the Fortis postback named a transaction; re-read it
 * from Fortis and apply the result exactly as the cron would. Returns null
 * when the row is not an ACH debit this module tracks.
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
  return reconcileAchTransaction(deps, tx, { origin });
}
