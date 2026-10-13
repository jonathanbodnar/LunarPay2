import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  reconcileAchTransaction,
  reconcileAchTransactionById,
  runAchReconcile,
  type AchReconcileDeps,
  type AchTxRow,
  type ChargeEventName,
  type FetchTransactionResult,
} from '@/lib/fortis/ach-settlement';
import { createFakeAchDb, type FakeOrg } from './support/fake-ach-db';

const NOW = new Date('2026-10-13T18:00:00Z');
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

/** Fortis as a script: fortis id → record (or an error). */
function harness(opts: {
  rows: AchTxRow[];
  fortis: Record<string, Record<string, unknown> | { error: string; httpStatus?: number }>;
  orgs?: FakeOrg[];
  sources?: { id: number; organizationId: number; donorId: number; fortisWalletId: string }[];
}) {
  const fake = createFakeAchDb({
    transactions: opts.rows,
    donors: [{ id: 77, amountAcum: 500, feeAcum: 0, netAcum: 0, firstDate: new Date('2026-01-01') }],
    orgs: opts.orgs ?? [ORG_109],
    sources: opts.sources,
  });
  const reads: string[] = [];
  const events: { org: number; url: string | null; event: ChargeEventName; data: Record<string, unknown> }[] = [];
  const logs: string[] = [];
  const deps: AchReconcileDeps = {
    db: fake.db,
    now: () => NOW,
    async fetchTransaction(org, id): Promise<FetchTransactionResult> {
      reads.push(`${org.fortisUserId}:${id}`);
      const answer = opts.fortis[id];
      if (!answer) return { ok: false, httpStatus: 404, message: 'Not Found' };
      if ('error' in answer) return { ok: false, httpStatus: answer.httpStatus as number | undefined, message: String(answer.error) };
      return { ok: true, transaction: { id, ...answer } };
    },
    deliver(org, event, data) {
      events.push({ org: org.organizationId, url: org.webhookUrl, event, data });
    },
    async logTransition({ tx, transition, origin }) {
      logs.push(`${origin}:${tx.id}:${transition.from.status}->${transition.to.status}`);
    },
  };
  return { fake, deps, reads, events, logs };
}

const settledAt = { status_code: 134, reason_code_id: 1000, token_id: 'vault-1' };
const returnedR01 = { status_code: 331, reason_code_id: 2101 };
const inFlight = { status_code: 132, reason_code_id: 1000 };

test('cron: a settled v1 debit becomes paid and the merchant gets one charge.succeeded', async () => {
  const h = harness({
    rows: [row(1)],
    fortis: { [fid(1)]: settledAt },
    sources: [{ id: 12, organizationId: 109, donorId: 77, fortisWalletId: 'vault-1' }],
  });
  const summary = await runAchReconcile(h.deps);
  assert.equal(summary.checked, 1);
  assert.equal(summary.transitioned.length, 1);
  assert.deepEqual(summary.transitioned[0].to, { status: 'P', statusAch: 'P' });
  assert.equal(h.fake.tx(1).status, 'P');
  assert.equal(h.fake.tx(1).statusAch, 'P');
  assert.equal(h.events.length, 1);
  assert.equal(h.events[0].event, 'charge.succeeded');
  assert.equal(h.events[0].url, ORG_109.webhookUrl);
  assert.equal(h.events[0].data.payment_method_id, 12); // resolved from Fortis token_id
  assert.equal(h.events[0].data.status, 'paid');
  assert.deepEqual(h.logs, ['cron:1:U->P']);
  assert.deepEqual(h.reads, [`user-109:${fid(1)}`]); // read with the merchant's own credentials
});

test('cron: a returned debit fails, totals come back down, charge.failed carries the reason', async () => {
  const h = harness({ rows: [row(2)], fortis: { [fid(2)]: returnedR01 } });
  await runAchReconcile(h.deps);
  assert.equal(h.fake.tx(2).status, 'N');
  assert.equal(h.fake.tx(2).statusAch, 'F');
  assert.equal(h.fake.donor(77).amountAcum, 450);
  assert.equal(h.events.length, 1);
  assert.equal(h.events[0].event, 'charge.failed');
  assert.equal(h.events[0].data.error, 'ACH return R01: Insufficient funds');
  assert.equal(h.events[0].data.return_code, 'R01');
});

test('idempotent: a second run over the same Fortis state changes and sends nothing', async () => {
  const h = harness({ rows: [row(3)], fortis: { [fid(3)]: settledAt } });
  await runAchReconcile(h.deps);
  // make the settled row due for its daily late-return check
  h.fake.tx(3).updatedAt = ago(2 * DAY);
  const second = await runAchReconcile(h.deps);
  assert.equal(second.checked, 1);
  assert.equal(second.transitioned.length, 0);
  assert.equal(second.unchanged, 1);
  assert.equal(h.events.length, 1);
});

test('a late return on a settled debit is caught by the settled watch', async () => {
  const h = harness({ rows: [row(4, { status: 'P', statusAch: 'P', updatedAt: ago(2 * DAY) })], fortis: { [fid(4)]: returnedR01 } });
  const summary = await runAchReconcile(h.deps);
  assert.equal(summary.transitioned.length, 1);
  assert.equal(h.fake.tx(4).status, 'N');
  assert.equal(h.events[0].event, 'charge.failed');
});

test('still in flight: nothing changes, but the row is marked checked so the queue rotates', async () => {
  const h = harness({ rows: [row(5)], fortis: { [fid(5)]: inFlight } });
  const summary = await runAchReconcile(h.deps);
  assert.equal(summary.unchanged, 1);
  assert.equal(h.fake.tx(5).status, 'U');
  assert.equal(h.fake.tx(5).updatedAt.getTime(), NOW.getTime());
  assert.equal(h.events.length, 0);
});

test('selection: only waiting/settled ACH debits that are old enough, never imports, cards or final rows', async () => {
  const rows = [
    row(10), // eligible pending
    row(11, { createdAt: ago(30 * 60 * 1000), updatedAt: ago(30 * 60 * 1000) }), // too young
    row(12, { updatedAt: ago(30 * 60 * 1000) }), // checked half an hour ago
    row(13, { givingSource: 'fortis_import', status: 'P', statusAch: null }), // import
    row(14, { givingSource: 'stripe_import', status: 'P', statusAch: null }), // import
    row(15, { source: 'CC', status: 'P', statusAch: null }), // card
    row(16, { status: 'N', statusAch: 'F' }), // final
    row(17, { status: 'P', statusAch: null, subscriptionId: 4 }), // recurring ACH, waiting
    row(18, { status: 'P', statusAch: 'P', updatedAt: ago(2 * DAY) }), // settled, due for watch
    row(19, { status: 'P', statusAch: 'P', updatedAt: ago(2 * HOUR) }), // settled, checked recently
    row(20, { status: 'P', statusAch: 'P', createdAt: ago(80 * DAY), updatedAt: ago(10 * DAY) }), // past the watch window
    row(21, { createdAt: ago(100 * DAY), updatedAt: ago(10 * DAY) }), // waiting too long
    row(22, { status: 'U', statusAch: null, givingSource: 'checkout' }), // hosted checkout, waiting
  ];
  const fortis = Object.fromEntries(rows.map((r) => [r.fortisTransactionId as string, inFlight]));
  const h = harness({ rows, fortis });
  await runAchReconcile(h.deps);
  const readIds = h.reads.map((r) => parseInt(r.split(':')[1], 16)).sort((a, b) => a - b);
  assert.deepEqual(readIds, [10, 17, 18, 22]);
});

test('bounded: limit caps Fortis reads; the next run picks up the rest (oldest-checked first)', async () => {
  const rows = [row(30, { updatedAt: ago(5 * DAY) }), row(31, { updatedAt: ago(4 * DAY) }), row(32, { updatedAt: ago(3 * DAY) })];
  const h = harness({ rows, fortis: Object.fromEntries(rows.map((r) => [r.fortisTransactionId as string, inFlight])) });
  const first = await runAchReconcile(h.deps, { limit: 2 });
  assert.equal(first.selected, 2);
  assert.deepEqual(h.reads.map((r) => parseInt(r.split(':')[1], 16)), [30, 31]);
  // the job runs hourly; two hours later the two checked rows are due again but the unchecked one leads
  h.deps.now = () => new Date(NOW.getTime() + 2 * HOUR);
  h.reads.length = 0;
  await runAchReconcile(h.deps, { limit: 1 });
  assert.deepEqual(h.reads.map((r) => parseInt(r.split(':')[1], 16)), [32]);
});

test('time budget: nothing new starts once it is spent', async () => {
  const h = harness({ rows: [row(40), row(41)], fortis: {} });
  const summary = await runAchReconcile(h.deps, { timeBudgetMs: -1 });
  assert.equal(summary.selected, 2);
  assert.equal(summary.checked, 0);
  assert.equal(summary.deferred, 2);
  assert.equal(h.reads.length, 0);
});

test('dry run reads Fortis and reports, but writes and sends nothing', async () => {
  const h = harness({ rows: [row(50), row(51)], fortis: { [fid(50)]: settledAt, [fid(51)]: returnedR01 } });
  const before = h.fake.tx(50).updatedAt.getTime();
  const summary = await runAchReconcile(h.deps, { dryRun: true });
  assert.equal(summary.dryRun, true);
  assert.deepEqual(summary.transitioned.map((r) => r.outcome), ['would_transition', 'would_transition']);
  assert.deepEqual(summary.transitioned.map((r) => r.event).sort(), ['charge.failed', 'charge.succeeded']);
  assert.equal(h.fake.tx(50).status, 'U');
  assert.equal(h.fake.tx(51).status, 'U');
  assert.equal(h.fake.tx(50).updatedAt.getTime(), before);
  assert.equal(h.fake.donor(77).amountAcum, 500);
  assert.equal(h.events.length, 0);
  assert.equal(h.fake.state.writes.length, 0);
});

test('Fortis trouble and missing credentials are reported per row and never throw', async () => {
  const h = harness({
    rows: [row(60), row(61, { organizationId: 300 }), row(62, { organizationId: 301 })],
    fortis: { [fid(60)]: { error: 'Unauthorized', httpStatus: 401 } },
    orgs: [
      ORG_109,
      { id: 300, webhookUrl: null, webhookSecret: null, fortisOnboarding: null },
      { id: 301, webhookUrl: null, webhookSecret: null, fortisOnboarding: { authUserId: 'u', authUserApiKey: 'PROVISIONING:1700000000000' } },
    ],
  });
  const summary = await runAchReconcile(h.deps);
  assert.equal(summary.errors.length, 1);
  assert.equal(summary.errors[0].message, 'HTTP 401: Unauthorized');
  assert.deepEqual(summary.skipped.map((r) => r.outcome), ['no_credentials', 'no_credentials']);
  assert.equal(h.events.length, 0);
  for (const id of [60, 61, 62]) assert.equal(h.fake.tx(id).status, 'U');
});

test('cron and webhook racing on one debit: one transition, one event', async () => {
  const h = harness({ rows: [row(70)], fortis: { [fid(70)]: settledAt } });
  const snapshot = { ...h.fake.tx(70) } as AchTxRow; // both read the row before either writes
  const [a, b] = await Promise.all([
    reconcileAchTransaction(h.deps, { ...snapshot }, { origin: 'cron' }),
    reconcileAchTransaction(h.deps, { ...snapshot }, { origin: 'webhook' }),
  ]);
  assert.deepEqual([a.outcome, b.outcome].sort(), ['lost_race', 'transitioned']);
  assert.equal(h.events.length, 1);
  assert.equal(h.logs.length, 1);
});

test('webhook path re-reads Fortis: the posted body is never trusted, and card rows are not handled here', async () => {
  // Fortis says the debit is still in flight — whatever a (possibly forged) postback claimed.
  const h = harness({ rows: [row(80), row(81, { source: 'CC', status: 'P', statusAch: null })], fortis: { [fid(80)]: inFlight } });
  const result = await reconcileAchTransactionById(h.deps, BigInt(80), 'webhook');
  assert.equal(result?.outcome, 'unchanged');
  assert.equal(h.fake.tx(80).status, 'U');
  assert.equal(h.events.length, 0);
  assert.equal(await reconcileAchTransactionById(h.deps, BigInt(81), 'webhook'), null);
  assert.equal(await reconcileAchTransactionById(h.deps, BigInt(999), 'webhook'), null);
});

test('webhook after the cron already settled it: no second event', async () => {
  const h = harness({ rows: [row(90)], fortis: { [fid(90)]: settledAt } });
  await runAchReconcile(h.deps);
  const result = await reconcileAchTransactionById(h.deps, BigInt(90), 'webhook');
  assert.equal(result?.outcome, 'unchanged');
  assert.equal(h.events.length, 1);
});

test('a failed delivery never undoes the committed transition', async () => {
  const h = harness({ rows: [row(95)], fortis: { [fid(95)]: settledAt } });
  h.deps.deliver = () => {
    throw new Error('queue unavailable');
  };
  const original = console.error;
  console.error = () => {};
  try {
    const result = await reconcileAchTransaction(h.deps, h.fake.tx(95), { origin: 'cron' });
    assert.equal(result.outcome, 'transitioned');
  } finally {
    console.error = original;
  }
  assert.equal(h.fake.tx(95).status, 'P');
});
