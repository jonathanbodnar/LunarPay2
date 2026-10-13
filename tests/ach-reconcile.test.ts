import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ACH_RUN_LOCK,
  ACH_WEBHOOK_RECHECK_MS,
  reconcileAchTransaction,
  reconcileAchTransactionById,
  runAchReconcile,
  type AchReconcileDeps,
  type AchTxRow,
  type FetchTransactionResult,
} from '@/lib/fortis/ach-settlement';
import { acquireJobLock } from '@/lib/job-lock';
import { createFakeAchDb, type FakeOrg, type FakeOutboxRow, type FakeSubscription } from './support/fake-ach-db';

const NOW = new Date('2026-10-20T18:00:00Z');
const EVENTS_SINCE = new Date('2026-10-14T00:00:00Z'); // the deploy
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const ago = (ms: number) => new Date(NOW.getTime() - ms);
const fid = (n: number) => n.toString(16).padStart(24, '0');

function row(id: number, over: Partial<AchTxRow> = {}): AchTxRow {
  return {
    id: BigInt(id),
    organizationId: 109,
    donorId: 77,
    status: 'U',
    statusAch: 'W',
    source: 'BNK',
    fortisTransactionId: fid(id),
    totalAmount: '50.00',
    subTotalAmount: '50.00',
    fee: '0.00',
    refundedAmount: '0.00',
    givingSource: 'api',
    subscriptionId: null,
    createdAt: ago(3 * DAY),
    updatedAt: ago(3 * DAY),
    ...over,
  };
}

const ORG_109: FakeOrg = {
  id: 109,
  webhookUrl: 'https://receiver.example/api/giving/webhook',
  webhookSecret: 'whsec_test',
  fortisOnboarding: { authUserId: 'user-109', authUserApiKey: 'key-109' },
};
const ORG_39: FakeOrg = {
  id: 39,
  webhookUrl: 'https://other-merchant.example/hooks',
  webhookSecret: 'whsec_39',
  fortisOnboarding: { authUserId: 'user-39', authUserApiKey: 'key-39' },
};

/** Fortis as a script: fortis id → record (or an error). */
function harness(opts: {
  rows: AchTxRow[];
  fortis: Record<string, Record<string, unknown> | { error: string; httpStatus?: number }>;
  orgs?: FakeOrg[];
  sources?: { id: number; organizationId: number; donorId: number; fortisWalletId: string }[];
  subscriptions?: FakeSubscription[];
  outbox?: FakeOutboxRow[];
  eventsSince?: Date | null;
}) {
  const fake = createFakeAchDb({
    transactions: opts.rows,
    donors: [{ id: 77, amountAcum: 500, feeAcum: 0, netAcum: 0, firstDate: new Date('2026-01-01') }],
    orgs: opts.orgs ?? [ORG_109, ORG_39],
    sources: opts.sources,
    subscriptions: opts.subscriptions,
    outbox: opts.outbox,
  });
  const reads: string[] = [];
  const dispatched: bigint[][] = [];
  const logs: string[] = [];
  let runs = 0;
  const deps: AchReconcileDeps = {
    db: fake.db,
    now: () => NOW,
    runId: () => `run-${++runs}`,
    chargeEventsSince: opts.eventsSince === undefined ? EVENTS_SINCE : opts.eventsSince,
    async fetchTransaction(org, id): Promise<FetchTransactionResult> {
      reads.push(`${org.fortisUserId}:${id}`);
      const answer = opts.fortis[id];
      if (!answer) return { ok: false, httpStatus: 404, message: 'Not Found' };
      if ('error' in answer) return { ok: false, httpStatus: answer.httpStatus as number | undefined, message: String(answer.error) };
      return { ok: true, transaction: { id, ...answer } };
    },
    dispatch(ids) {
      dispatched.push(ids);
    },
    async logTransition({ tx, transition, origin }) {
      logs.push(`${origin}:${tx.id}:${transition.from.status}->${transition.to.status}`);
    },
  };
  const queued = () => fake.outbox().map((r) => ({ event: r.event, tx: String(r.transactionId), org: r.organizationId, data: JSON.parse(r.payload) }));
  const readIds = () => reads.map((r) => parseInt(r.split(':')[1], 16)).sort((a, b) => a - b);
  return { fake, deps, reads, readIds, dispatched, logs, queued };
}

const settledAt = { status_code: 134, reason_code_id: 1000, token_id: 'vault-1' };
const returnedR01 = { status_code: 331, reason_code_id: 2101 };
const returnedR02 = { status_code: 331, reason_code_id: 2102 };
const inFlight = { status_code: 132, reason_code_id: 1000 };

// ── Announcements ────────────────────────────────────────────────────────────

test('a v1 debit after the cutoff settles: paid, charge.succeeded queued in the outbox and dispatched', async () => {
  const h = harness({
    rows: [row(1)],
    fortis: { [fid(1)]: settledAt },
    sources: [{ id: 12, organizationId: 109, donorId: 77, fortisWalletId: 'vault-1' }],
  });
  const summary = await runAchReconcile(h.deps);
  assert.equal(summary.ran, true);
  assert.equal(summary.transitioned.length, 1);
  assert.equal(summary.transitioned[0].announced, true);
  assert.equal(h.fake.tx(1).status, 'P');
  assert.equal(h.fake.tx(1).statusAch, 'P');
  const q = h.queued();
  assert.equal(q.length, 1);
  assert.equal(q[0].event, 'charge.succeeded');
  assert.equal(q[0].data.payment_method_id, 12);
  assert.equal(q[0].data.status, 'paid');
  assert.deepEqual(h.dispatched, [[h.fake.outbox()[0].id]]);
  assert.deepEqual(h.logs, ['cron:1:U->P']);
  assert.deepEqual(h.reads, [`user-109:${fid(1)}`]); // the merchant's own credentials
});

test('a returned v1 debit: failed, totals back down, charge.failed with status "returned"', async () => {
  const h = harness({ rows: [row(2)], fortis: { [fid(2)]: returnedR01 } });
  await runAchReconcile(h.deps);
  assert.equal(h.fake.tx(2).status, 'N');
  assert.equal(h.fake.donor(77).amountAcum, 450);
  const [failed] = h.queued();
  assert.equal(failed.event, 'charge.failed');
  assert.equal(failed.data.status, 'returned');
  assert.equal(failed.data.error, 'ACH return R01: Insufficient funds');
  assert.equal(failed.data.return_code, 'R01');
});

test('first run = backfill: old rows and non-opted-in paths are reconciled SILENTLY', async () => {
  const before = ago(30 * DAY); // created before ACH_CHARGE_EVENTS_SINCE
  const rows = [
    row(10, { createdAt: before, updatedAt: before }), // old v1 charge
    row(11, { status: 'P', statusAch: null, subscriptionId: 4, fee: '0.88', subTotalAmount: '49.12', createdAt: before, updatedAt: before }), // old renewal
    row(12, { givingSource: 'checkout', statusAch: null }), // hosted checkout, recent
    row(13, { givingSource: 'payment_link' }), // payment link, recent
    row(14, { status: 'P', statusAch: 'W', givingSource: 'dashboard' }), // dashboard charge, recent
    row(15, { organizationId: 39, status: 'P', statusAch: null, fee: '1.45', subTotalAmount: '48.55' }), // installment, other merchant
  ];
  const fortis = Object.fromEntries(rows.map((r, i) => [r.fortisTransactionId as string, i % 2 ? returnedR01 : settledAt]));
  const h = harness({ rows, fortis, subscriptions: [{ id: 4, status: 'A', consecutiveFailures: 0, failTrxns: 0, donorId: 77, email: 'd@example.org' }] });
  const summary = await runAchReconcile(h.deps);
  assert.equal(summary.transitioned.length, rows.length);
  assert.ok(summary.transitioned.every((r) => r.announced === false));
  assert.equal(h.fake.outbox().length, 0, 'nothing queued');
  assert.equal(h.dispatched.length, 0, 'nothing sent');
  // statuses were still reconciled
  assert.equal(h.fake.tx(10).status, 'P');
  assert.equal(h.fake.tx(11).status, 'N');
  assert.equal(h.fake.tx(12).status, 'P');
});

test('ACH_CHARGE_EVENTS_SINCE unset: statuses reconciled, nobody told', async () => {
  const h = harness({ rows: [row(20)], fortis: { [fid(20)]: returnedR01 }, eventsSince: null });
  const summary = await runAchReconcile(h.deps);
  assert.equal(summary.transitioned[0].announced, false);
  assert.equal(h.fake.tx(20).status, 'N');
  assert.equal(h.fake.outbox().length, 0);
});

test('a merchant with no webhook URL gets no outbox rows', async () => {
  const h = harness({
    rows: [row(21)],
    fortis: { [fid(21)]: settledAt },
    orgs: [{ ...ORG_109, webhookUrl: null }],
  });
  await runAchReconcile(h.deps);
  assert.equal(h.fake.tx(21).status, 'P');
  assert.equal(h.fake.outbox().length, 0);
});

test('dry run reports what would change and who would be told — writes and sends nothing', async () => {
  const old = ago(30 * DAY);
  const h = harness({
    rows: [row(30), row(31, { createdAt: old, updatedAt: old })],
    fortis: { [fid(30)]: settledAt, [fid(31)]: returnedR01 },
  });
  const summary = await runAchReconcile(h.deps, { dryRun: true });
  assert.equal(summary.dryRun, true);
  assert.deepEqual(
    summary.transitioned.map((r) => [r.transactionId, r.outcome, r.event, r.announced]).sort(),
    [['30', 'would_transition', 'charge.succeeded', true], ['31', 'would_transition', 'charge.failed', false]],
  );
  assert.equal(h.fake.tx(30).status, 'U');
  assert.equal(h.fake.state.writes.length, 0);
  assert.equal(h.fake.outbox().length, 0);
  assert.equal(h.dispatched.length, 0);
});

// ── Returned renewals ────────────────────────────────────────────────────────

test('an R02 on a renewal: charge.failed + subscription cancelled + subscription.cancelled; no payment.failed', async () => {
  const h = harness({
    rows: [row(40, { status: 'P', statusAch: null, subscriptionId: 4, fee: '0.88', subTotalAmount: '49.12' })],
    fortis: { [fid(40)]: returnedR02 },
    subscriptions: [{ id: 4, status: 'A', consecutiveFailures: 0, failTrxns: 2, donorId: 77, email: 'd@example.org' }],
  });
  const summary = await runAchReconcile(h.deps);
  assert.equal(summary.transitioned[0].subscriptionCancelled, true);
  assert.equal(h.fake.subscription(4).status, 'D');
  assert.equal(h.fake.subscription(4).failTrxns, 3);
  assert.deepEqual(h.queued().map((q) => q.event).sort(), ['charge.failed', 'subscription.cancelled']);
  assert.equal(h.queued().some((q) => q.event === 'payment.failed'), false);
  assert.equal(h.dispatched[0].length, 2);
});

test('a pre-cutoff renewal that a return cancels: no charge.failed, but subscription.cancelled is always queued', async () => {
  const old = ago(30 * DAY); // before ACH_CHARGE_EVENTS_SINCE
  const renewal = row(41, { status: 'P', statusAch: null, subscriptionId: 5, fee: '0.88', subTotalAmount: '49.12', createdAt: old, updatedAt: old });
  const sub = { id: 5, status: 'A', consecutiveFailures: 0, failTrxns: 0, donorId: 77, email: 'd@example.org' };

  // the dry run shows it, and writes nothing
  const dry = harness({ rows: [renewal], fortis: { [fid(41)]: returnedR02 }, subscriptions: [sub] });
  const preview = await runAchReconcile(dry.deps, { dryRun: true });
  assert.equal(preview.transitioned[0].announced, false);
  assert.equal(preview.transitioned[0].subscriptionCancelled, true);
  assert.deepEqual(preview.transitioned[0].events, ['subscription.cancelled']);
  assert.equal(dry.fake.subscription(5).status, 'A');
  assert.equal(dry.fake.outbox().length, 0);

  // the real run does exactly that
  const h = harness({ rows: [renewal], fortis: { [fid(41)]: returnedR02 }, subscriptions: [sub] });
  const summary = await runAchReconcile(h.deps);
  assert.deepEqual(summary.transitioned[0].events, ['subscription.cancelled']);
  assert.equal(h.fake.subscription(5).status, 'D');
  assert.deepEqual(h.queued().map((q) => q.event), ['subscription.cancelled']);
  assert.equal(h.queued()[0].data.reason, 'Auto-cancelled after ACH return R02 (Bank account closed)');

  // no webhook URL → still cancelled, nothing queued
  const quiet = harness({
    rows: [renewal],
    fortis: { [fid(41)]: returnedR02 },
    subscriptions: [sub],
    orgs: [{ ...ORG_109, webhookUrl: null }],
  });
  await runAchReconcile(quiet.deps);
  assert.equal(quiet.fake.subscription(5).status, 'D');
  assert.equal(quiet.fake.outbox().length, 0);
});

test("the reviewer's probe: month 1 returned R10 after month 2 settled — cancelled, and the dry run says so", async () => {
  const month1 = row(43, { status: 'P', statusAch: 'P', subscriptionId: 6, fee: '0.88', subTotalAmount: '49.12', createdAt: ago(55 * DAY), updatedAt: ago(2 * DAY) });
  const month2 = row(44, { status: 'P', statusAch: 'P', subscriptionId: 6, fee: '0.88', subTotalAmount: '49.12', createdAt: ago(25 * DAY), updatedAt: ago(3 * HOUR) });
  const sub = { id: 6, status: 'A', consecutiveFailures: 0, failTrxns: 0, donorId: 77, email: 'd@example.org' };
  const r10 = { status_code: 331, reason_code_id: 2110 };
  const dry = harness({ rows: [month1, month2], fortis: { [fid(43)]: r10 }, subscriptions: [sub] });
  const preview = await runAchReconcile(dry.deps, { dryRun: true });
  assert.equal(preview.transitioned.length, 1);
  assert.equal(preview.transitioned[0].subscriptionCancelled, true);
  assert.ok(preview.transitioned[0].events?.includes('subscription.cancelled'));
  const h = harness({ rows: [month1, month2], fortis: { [fid(43)]: r10 }, subscriptions: [sub] });
  await runAchReconcile(h.deps);
  assert.equal(h.fake.subscription(6).status, 'D');
});

test('a dry run is read-only: no run lease written, and it runs even while a real run holds the lease', async () => {
  const h = harness({ rows: [row(42)], fortis: { [fid(42)]: settledAt } });
  const preview = await runAchReconcile(h.deps, { dryRun: true });
  assert.equal(preview.ran, true);
  assert.equal(h.fake.state.locks.length, 0);
  assert.equal(h.fake.state.writes.length, 0);
  assert.equal(await acquireJobLock(h.fake.db, ACH_RUN_LOCK, 'real-run', 5 * 60 * 1000, NOW), true);
  const during = await runAchReconcile(h.deps, { dryRun: true });
  assert.equal(during.ran, true);
  assert.equal(during.transitioned.length, 1);
  assert.equal(h.fake.state.writes.length, 0);
});

// ── Durability ───────────────────────────────────────────────────────────────

test('each run first re-dispatches announcements that never got a 2xx', async () => {
  const pendingRow: FakeOutboxRow = {
    id: BigInt(7), organizationId: 109, transactionId: BigInt(99), event: 'charge.failed', payload: '{}', dedupeKey: 'charge.failed:99',
    status: 'pending', attempts: 3, nextAttemptAt: ago(HOUR), lastError: 'HTTP 503', deliveredAt: null,
  };
  const notDue: FakeOutboxRow = { ...pendingRow, id: BigInt(8), dedupeKey: 'charge.failed:98', nextAttemptAt: new Date(NOW.getTime() + HOUR) };
  const h = harness({ rows: [], fortis: {}, outbox: [pendingRow, notDue] });
  const summary = await runAchReconcile(h.deps);
  assert.equal(summary.outboxRetried, 1);
  assert.deepEqual(h.dispatched, [[BigInt(7)]]);
  // a dry run only reports
  const dry = harness({ rows: [], fortis: {}, outbox: [pendingRow] });
  const s2 = await runAchReconcile(dry.deps, { dryRun: true });
  assert.equal(s2.outboxRetried, 1);
  assert.equal(dry.dispatched.length, 0);
});

test('a dispatch that throws never undoes the committed transition (the outbox keeps it)', async () => {
  const h = harness({ rows: [row(50)], fortis: { [fid(50)]: settledAt } });
  h.deps.dispatch = () => {
    throw new Error('after() unavailable');
  };
  const original = console.error;
  console.error = () => {};
  try {
    const result = await reconcileAchTransaction(h.deps, h.fake.tx(50), { origin: 'cron' });
    assert.equal(result.outcome, 'transitioned');
  } finally {
    console.error = original;
  }
  assert.equal(h.fake.tx(50).status, 'P');
  assert.equal(h.fake.outbox()[0].status, 'pending'); // the next run re-sends it
});

// ── Idempotence, selection, bounds ───────────────────────────────────────────

test('idempotent: a second run over the same Fortis state changes and queues nothing', async () => {
  const h = harness({ rows: [row(60)], fortis: { [fid(60)]: settledAt } });
  await runAchReconcile(h.deps);
  h.fake.tx(60).updatedAt = ago(2 * DAY); // due for its daily late-return check
  const second = await runAchReconcile(h.deps);
  assert.equal(second.transitioned.length, 0);
  assert.equal(second.unchanged, 1);
  assert.equal(h.fake.outbox().length, 1);
});

test('a late return on a settled debit is caught by the settled watch', async () => {
  const h = harness({ rows: [row(61, { status: 'P', statusAch: 'P', updatedAt: ago(2 * DAY) })], fortis: { [fid(61)]: returnedR01 } });
  const summary = await runAchReconcile(h.deps);
  assert.equal(summary.transitioned.length, 1);
  assert.equal(h.fake.tx(61).status, 'N');
});

test('selection: only waiting/settled ACH debits that are old enough, never imports, cards or final rows', async () => {
  const rows = [
    row(70),
    row(71, { createdAt: ago(30 * 60 * 1000), updatedAt: ago(30 * 60 * 1000) }), // too young
    row(72, { updatedAt: ago(30 * 60 * 1000) }), // checked half an hour ago
    row(73, { givingSource: 'fortis_import', status: 'P', statusAch: null }),
    row(74, { givingSource: 'stripe_import', status: 'P', statusAch: null }),
    row(75, { source: 'CC', status: 'P', statusAch: null }),
    row(76, { status: 'N', statusAch: 'F' }),
    row(77, { status: 'P', statusAch: null, subscriptionId: 4 }),
    row(78, { status: 'P', statusAch: 'P', updatedAt: ago(2 * DAY) }),
    row(79, { status: 'P', statusAch: 'P', updatedAt: ago(2 * HOUR) }),
    row(80, { status: 'P', statusAch: 'P', createdAt: ago(80 * DAY), updatedAt: ago(10 * DAY) }),
    row(81, { createdAt: ago(100 * DAY), updatedAt: ago(10 * DAY) }),
    row(82, { status: 'U', statusAch: null, givingSource: 'checkout' }),
  ];
  const h = harness({ rows, fortis: Object.fromEntries(rows.map((r) => [r.fortisTransactionId as string, inFlight])) });
  await runAchReconcile(h.deps);
  assert.deepEqual(h.readIds(), [70, 77, 78, 82]);
});

test('a row with a non-Fortis id is rotated out of the head of the queue, not re-picked forever', async () => {
  const rows = [
    row(90, { fortisTransactionId: 'TXN-LEGACY-1', updatedAt: ago(10 * DAY) }), // oldest-checked, unreadable id
    row(91, { updatedAt: ago(5 * DAY) }),
  ];
  const h = harness({ rows, fortis: { [fid(91)]: inFlight } });
  const first = await runAchReconcile(h.deps, { limit: 1 });
  assert.deepEqual(first.skipped.map((r) => [r.transactionId, r.outcome]), [['90', 'not_watchable']]);
  assert.equal(h.fake.tx(90).updatedAt.getTime(), NOW.getTime()); // touched
  h.deps.now = () => new Date(NOW.getTime() + 2 * HOUR);
  await runAchReconcile(h.deps, { limit: 1 });
  assert.deepEqual(h.readIds(), [91]); // the real debit is reached on the next run
});

test('bounded: limit caps Fortis reads; the next run picks up the rest (oldest-checked first)', async () => {
  const rows = [row(100, { updatedAt: ago(5 * DAY) }), row(101, { updatedAt: ago(4 * DAY) }), row(102, { updatedAt: ago(3 * DAY) })];
  const h = harness({ rows, fortis: Object.fromEntries(rows.map((r) => [r.fortisTransactionId as string, inFlight])) });
  const first = await runAchReconcile(h.deps, { limit: 2 });
  assert.equal(first.selected, 2);
  assert.deepEqual(h.readIds(), [100, 101]);
  h.deps.now = () => new Date(NOW.getTime() + 2 * HOUR);
  h.reads.length = 0;
  await runAchReconcile(h.deps, { limit: 1 });
  assert.deepEqual(h.readIds(), [102]);
});

test('time budget: nothing new starts once it is spent', async () => {
  const h = harness({ rows: [row(110), row(111)], fortis: {} });
  const summary = await runAchReconcile(h.deps, { timeBudgetMs: -1 });
  assert.equal(summary.selected, 2);
  assert.equal(summary.checked, 0);
  assert.equal(summary.deferred, 2);
  assert.equal(h.reads.length, 0);
});

test('run lock: a second scheduler firing during a run reads nothing; the lock is released after', async () => {
  const h = harness({ rows: [row(120)], fortis: { [fid(120)]: inFlight } });
  assert.equal(await acquireJobLock(h.fake.db, ACH_RUN_LOCK, 'someone-else', 5 * 60 * 1000, NOW), true);
  const blocked = await runAchReconcile(h.deps);
  assert.equal(blocked.ran, false);
  assert.equal(h.reads.length, 0);
  // once the other run's lease lapses, a run goes ahead and releases its own lease when done
  h.deps.now = () => new Date(NOW.getTime() + 6 * 60 * 1000);
  const ran = await runAchReconcile(h.deps);
  assert.equal(ran.ran, true);
  assert.equal(h.reads.length, 1);
  // released on completion: the next run can start at once
  assert.equal((await runAchReconcile(h.deps)).ran, true);
});

test('Fortis trouble and missing credentials are reported per row and never throw', async () => {
  const h = harness({
    rows: [row(130), row(131, { organizationId: 300 }), row(132, { organizationId: 301 })],
    fortis: { [fid(130)]: { error: 'Unauthorized', httpStatus: 401 } },
    orgs: [
      ORG_109,
      { id: 300, webhookUrl: null, webhookSecret: null, fortisOnboarding: null },
      { id: 301, webhookUrl: null, webhookSecret: null, fortisOnboarding: { authUserId: 'u', authUserApiKey: 'PROVISIONING:1700000000000' } },
    ],
  });
  const summary = await runAchReconcile(h.deps);
  assert.equal(summary.errors[0].message, 'HTTP 401: Unauthorized');
  assert.deepEqual(summary.skipped.map((r) => r.outcome), ['no_credentials', 'no_credentials']);
  for (const id of [130, 131, 132]) assert.equal(h.fake.tx(id).status, 'U');
});

// ── Webhook path ─────────────────────────────────────────────────────────────

test('cron and webhook racing on one debit: one transition, one queued event', async () => {
  const h = harness({ rows: [row(140)], fortis: { [fid(140)]: settledAt } });
  const snapshot = { ...h.fake.tx(140) } as AchTxRow;
  const [a, b] = await Promise.all([
    reconcileAchTransaction(h.deps, { ...snapshot }, { origin: 'cron' }),
    reconcileAchTransaction(h.deps, { ...snapshot }, { origin: 'webhook' }),
  ]);
  assert.deepEqual([a.outcome, b.outcome].sort(), ['lost_race', 'transitioned']);
  assert.equal(h.fake.outbox().length, 1);
  assert.equal(h.dispatched.length, 1);
});

test('webhook re-reads are throttled to one per transaction per minute', async () => {
  const h = harness({ rows: [row(150, { updatedAt: ago(2 * ACH_WEBHOOK_RECHECK_MS) })], fortis: { [fid(150)]: inFlight } });
  assert.equal((await reconcileAchTransactionById(h.deps, BigInt(150), 'webhook'))?.outcome, 'unchanged');
  assert.equal(h.reads.length, 1);
  // a burst of (possibly forged) posts right after: no further Fortis reads
  for (let i = 0; i < 5; i++) {
    assert.equal((await reconcileAchTransactionById(h.deps, BigInt(150), 'webhook'))?.outcome, 'throttled');
  }
  assert.equal(h.reads.length, 1);
  h.deps.now = () => new Date(NOW.getTime() + ACH_WEBHOOK_RECHECK_MS + 1);
  assert.equal((await reconcileAchTransactionById(h.deps, BigInt(150), 'webhook'))?.outcome, 'unchanged');
  assert.equal(h.reads.length, 2);
});

test('webhook path re-reads Fortis: a body claiming success changes nothing while Fortis says in flight', async () => {
  const h = harness({ rows: [row(160), row(161, { source: 'CC', status: 'P', statusAch: null })], fortis: { [fid(160)]: inFlight } });
  assert.equal((await reconcileAchTransactionById(h.deps, BigInt(160), 'webhook'))?.outcome, 'unchanged');
  assert.equal(h.fake.tx(160).status, 'U');
  assert.equal(await reconcileAchTransactionById(h.deps, BigInt(161), 'webhook'), null);
  assert.equal(await reconcileAchTransactionById(h.deps, BigInt(999), 'webhook'), null);
});
