import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  achChargePath,
  achWatchPhase,
  announcesAchOutcome,
  chargeEventPayload,
  commitAchTransition,
  parseChargeEventsSince,
  planAchTransition,
  type AchStateChange,
  type AchTxRow,
} from '@/lib/fortis/ach-settlement';
import { classifyAchTransaction } from '@/lib/fortis/ach-status';
import { createFakeAchDb, type FakeSubscription } from './support/fake-ach-db';

const FORTIS_ID = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const SETTLED = classifyAchTransaction({ status_code: 134, reason_code_id: 1000 });
const RETURNED_R01 = classifyAchTransaction({ status_code: 331, reason_code_id: 2101 });
const RETURNED_R02 = classifyAchTransaction({ status_code: 331, reason_code_id: 2102 });
const VOIDED = classifyAchTransaction({ status_code: 201, reason_code_id: 2200 });
const DECLINED = classifyAchTransaction({ status_code: 301, reason_code_id: 1640 });
const IN_FLIGHT = classifyAchTransaction({ status_code: 133, reason_code_id: 1000 });

/** A POST /api/v1/charges ACH debit as written today: U + W, fee 0. */
function v1Debit(over: Partial<AchTxRow> = {}): AchTxRow {
  return {
    id: BigInt(501),
    organizationId: 109,
    donorId: 77,
    status: 'U',
    statusAch: 'W',
    source: 'BNK',
    fortisTransactionId: FORTIS_ID,
    totalAmount: '50.00',
    subTotalAmount: '50.00',
    fee: '0.00',
    refundedAmount: '0.00',
    givingSource: 'api',
    subscriptionId: null,
    createdAt: new Date('2026-10-14T12:00:00Z'),
    updatedAt: new Date('2026-10-14T12:00:00Z'),
    ...over,
  };
}

function asChange(t: ReturnType<typeof planAchTransition>): AchStateChange {
  assert.notEqual(t.kind, 'none');
  return t as AchStateChange;
}

// ── Which rows are watched, and who is told ──────────────────────────────────

test('watch phase: waiting debits in every shape the writers leave them', () => {
  assert.equal(achWatchPhase(v1Debit()), 'pending');
  assert.equal(achWatchPhase(v1Debit({ statusAch: null })), 'pending');
  assert.equal(achWatchPhase(v1Debit({ status: 'P', statusAch: null, subscriptionId: 9 })), 'pending');
  assert.equal(achWatchPhase(v1Debit({ status: 'P', statusAch: 'W' })), 'pending');
  assert.equal(achWatchPhase(v1Debit({ statusAch: 'pending' })), 'pending');
  assert.equal(achWatchPhase(v1Debit({ status: 'P', statusAch: 'P' })), 'settled');
});

test('watch phase: final rows, card rows, imports and foreign ids are never touched', () => {
  assert.equal(achWatchPhase(v1Debit({ status: 'N', statusAch: 'F' })), null);
  assert.equal(achWatchPhase(v1Debit({ status: 'N', statusAch: 'W' })), null);
  assert.equal(achWatchPhase(v1Debit({ status: 'V', statusAch: 'F' })), null);
  assert.equal(achWatchPhase(v1Debit({ status: 'R', statusAch: 'P' })), null);
  assert.equal(achWatchPhase(v1Debit({ source: 'CC' })), null);
  assert.equal(achWatchPhase(v1Debit({ givingSource: 'fortis_import', status: 'P', statusAch: null })), null);
  assert.equal(achWatchPhase(v1Debit({ fortisTransactionId: null })), null);
  assert.equal(achWatchPhase(v1Debit({ fortisTransactionId: 'abc123' })), null);
});

test('charge path: v1 charge, renewal, installment, checkout, other', () => {
  assert.equal(achChargePath(v1Debit()), 'v1_charge');
  assert.equal(achChargePath(v1Debit({ subscriptionId: 4, givingSource: 'api', fee: '0.88' })), 'subscription');
  assert.equal(achChargePath(v1Debit({ subscriptionId: 4, givingSource: 'checkout' })), 'subscription');
  assert.equal(achChargePath(v1Debit({ fee: '1.45' })), 'installment');
  assert.equal(achChargePath(v1Debit({ givingSource: 'checkout' })), 'checkout');
  assert.equal(achChargePath(v1Debit({ givingSource: 'payment_link' })), 'other');
  assert.equal(achChargePath(v1Debit({ givingSource: 'dashboard' })), 'other');
});

test('announced only for v1 charges and renewals created at/after ACH_CHARGE_EVENTS_SINCE', () => {
  const since = parseChargeEventsSince('2026-10-14T00:00:00Z');
  assert.ok(since);
  assert.equal(announcesAchOutcome(v1Debit(), since), true);
  assert.equal(announcesAchOutcome(v1Debit({ subscriptionId: 4, fee: '0.88' }), since), true);
  // before the cutoff: reconciled silently
  assert.equal(announcesAchOutcome(v1Debit({ createdAt: new Date('2026-10-13T23:59:59Z') }), since), false);
  // paths that never sent charge.* stay silent
  for (const givingSource of ['checkout', 'payment_link', 'dashboard', 'invoice']) {
    assert.equal(announcesAchOutcome(v1Debit({ givingSource }), since), false, givingSource);
  }
  assert.equal(announcesAchOutcome(v1Debit({ fee: '1.45' }), since), false); // installment
  // env unset or garbage → nobody is told
  assert.equal(parseChargeEventsSince(undefined), null);
  assert.equal(parseChargeEventsSince(''), null);
  assert.equal(parseChargeEventsSince('soon'), null);
  assert.equal(announcesAchOutcome(v1Debit(), null), false);
});

// ── Transitions + donor running totals ───────────────────────────────────────

test('v1 charge settles: U/W → P/P, charge.succeeded, totals untouched (already counted at creation)', () => {
  const change = asChange(planAchTransition(v1Debit(), SETTLED));
  assert.equal(change.kind, 'settle');
  assert.deepEqual(change.to, { status: 'P', statusAch: 'P' });
  assert.equal(change.event, 'charge.succeeded');
  assert.equal(change.donorDelta, null);
});

test('v1 charge returned: U/W → N/F, amount_acum taken back (only what v1 added)', () => {
  const change = asChange(planAchTransition(v1Debit(), RETURNED_R01));
  assert.deepEqual(change.to, { status: 'N', statusAch: 'F' });
  assert.equal(change.event, 'charge.failed');
  assert.deepEqual(change.donorDelta, { amount: -50, fee: 0, net: 0, setFirstDate: false });
});

test('a voided debit is recorded as V', () => {
  assert.deepEqual(asChange(planAchTransition(v1Debit(), VOIDED)).to, { status: 'V', statusAch: 'F' });
});

test('payment-link / checkout / renewal / installment donor accounting', () => {
  const link = v1Debit({ givingSource: 'payment_link', totalAmount: '100.00', fee: '3.20', subTotalAmount: '96.80' });
  assert.deepEqual(asChange(planAchTransition(link, SETTLED)).donorDelta, { amount: 100, fee: 3.2, net: 96.8, setFirstDate: true });
  assert.equal(asChange(planAchTransition(link, RETURNED_R01)).donorDelta, null);
  const checkout = v1Debit({ givingSource: 'checkout', statusAch: null, totalAmount: '20.00', fee: '0.76', subTotalAmount: '19.24' });
  assert.equal(asChange(planAchTransition(checkout, SETTLED)).donorDelta, null);
  assert.deepEqual(asChange(planAchTransition(checkout, RETURNED_R01)).donorDelta, { amount: -20, fee: -0.76, net: -19.24, setFirstDate: false });
  const renewal = v1Debit({ status: 'P', statusAch: null, subscriptionId: 9, totalAmount: '25.00', fee: '0.88', subTotalAmount: '24.12' });
  assert.equal(asChange(planAchTransition(renewal, SETTLED)).donorDelta, null);
  assert.deepEqual(asChange(planAchTransition(renewal, RETURNED_R01)).donorDelta, { amount: -25, fee: -0.88, net: -24.12, setFirstDate: false });
  const installment = v1Debit({ status: 'P', statusAch: null, fee: '1.45', subTotalAmount: '48.55' });
  assert.deepEqual(asChange(planAchTransition(installment, RETURNED_R01)).donorDelta, { amount: -50, fee: -1.45, net: -48.55, setFirstDate: false });
});

test('settled debit: re-settling is a no-op; a late return fails it, net of any partial refund', () => {
  const settled = v1Debit({ status: 'P', statusAch: 'P', refundedAmount: '10.00' });
  assert.equal(planAchTransition(settled, SETTLED).kind, 'none');
  const late = asChange(planAchTransition(settled, RETURNED_R01));
  assert.deepEqual(late.to, { status: 'N', statusAch: 'F' });
  assert.deepEqual(late.donorDelta, { amount: -40, fee: 0, net: 0, setFirstDate: false });
});

test('still in flight, unknown codes, and final rows change nothing', () => {
  assert.equal(planAchTransition(v1Debit(), IN_FLIGHT).kind, 'none');
  assert.equal(planAchTransition(v1Debit(), classifyAchTransaction({ status_code: 999 })).kind, 'none');
  assert.equal(planAchTransition(v1Debit({ status: 'N', statusAch: 'F' }), SETTLED).kind, 'none');
});

// ── Event payloads ───────────────────────────────────────────────────────────

test('charge.succeeded has exactly the keys POST /v1/charges sends, with status paid', () => {
  const { event, data } = chargeEventPayload(v1Debit(), asChange(planAchTransition(v1Debit(), SETTLED)), { paymentMethodId: 12, description: 'Tithe' });
  assert.equal(event, 'charge.succeeded');
  assert.deepEqual(data, {
    transaction_id: '501',
    customer_id: 77,
    payment_method_id: 12,
    amount_cents: 5000,
    currency: 'USD',
    payment_method: 'ach',
    status: 'paid',
    captured: true,
    fortis_transaction_id: FORTIS_ID,
    description: 'Tithe',
  });
});

test('charge.failed: status "returned" for returns (error wording unchanged), voided / failed otherwise', () => {
  const ctx = { paymentMethodId: null, description: null };
  const returned = chargeEventPayload(v1Debit(), asChange(planAchTransition(v1Debit(), RETURNED_R01)), ctx);
  assert.equal(returned.event, 'charge.failed');
  assert.deepEqual(returned.data, {
    transaction_id: '501',
    customer_id: 77,
    payment_method_id: null,
    amount_cents: 5000,
    currency: 'USD',
    payment_method: 'ach',
    status: 'returned',
    error: 'ACH return R01: Insufficient funds',
    return_code: 'R01',
    fortis_transaction_id: FORTIS_ID,
    description: null,
  });
  assert.equal(chargeEventPayload(v1Debit(), asChange(planAchTransition(v1Debit(), VOIDED)), ctx).data.status, 'voided');
  const declined = chargeEventPayload(v1Debit(), asChange(planAchTransition(v1Debit(), DECLINED)), ctx).data;
  assert.equal(declined.status, 'failed');
  assert.equal(declined.return_code, null);
});

// ── The conditional write ────────────────────────────────────────────────────

const NOW = new Date('2026-10-20T00:00:00Z');

test('commit is compare-and-set: only the first of two identical commits lands, totals move once', async () => {
  const fake = createFakeAchDb({
    transactions: [v1Debit()],
    donors: [{ id: 77, amountAcum: 50, feeAcum: 0, netAcum: 0, firstDate: new Date('2026-01-01') }],
  });
  const change = asChange(planAchTransition(v1Debit(), RETURNED_R01));
  const [a, b] = await Promise.all([
    commitAchTransition(fake.db, v1Debit(), change, { status_code: 331 }, NOW),
    commitAchTransition(fake.db, v1Debit(), change, { status_code: 331 }, NOW),
  ]);
  assert.deepEqual([a.won, b.won].sort(), [false, true]);
  assert.equal(fake.tx(501).status, 'N');
  assert.equal(fake.donor(77).amountAcum, 0);
  assert.equal(JSON.parse(fake.tx(501).requestResponse as string).status_code, 331);
});

test('commit queues the announcement in the same transaction, and a failure supersedes a pending "succeeded"', async () => {
  const settledRow = v1Debit({ status: 'P', statusAch: 'P' });
  const fake = createFakeAchDb({
    transactions: [settledRow],
    donors: [{ id: 77, amountAcum: 50, feeAcum: 0, netAcum: 0, firstDate: null }],
    outbox: [{
      id: BigInt(1), organizationId: 109, transactionId: BigInt(501), event: 'charge.succeeded', payload: '{}',
      dedupeKey: 'charge.succeeded:501', status: 'pending', attempts: 2, nextAttemptAt: NOW, lastError: 'x', deliveredAt: null,
    }],
  });
  const change = asChange(planAchTransition(settledRow, RETURNED_R01));
  const result = await commitAchTransition(fake.db, settledRow, change, {}, NOW, {
    events: [{ organizationId: 109, transactionId: BigInt(501), event: 'charge.failed', data: { status: 'returned' }, dedupeKey: 'charge.failed:501' }],
    subscriptionCancelled: true,
  });
  assert.equal(result.won, true);
  assert.equal(result.outboxIds.length, 1);
  const rows = fake.outbox();
  assert.equal(rows.find((r) => r.event === 'charge.succeeded')?.status, 'superseded');
  const failed = rows.find((r) => r.event === 'charge.failed');
  assert.equal(failed?.status, 'pending');
  assert.equal(failed?.nextAttemptAt.getTime(), NOW.getTime());
  assert.deepEqual(JSON.parse(failed!.payload), { status: 'returned' });
});

test('a commit that loses the race queues nothing', async () => {
  const fake = createFakeAchDb({ transactions: [v1Debit({ status: 'N', statusAch: 'F' })] });
  const result = await commitAchTransition(fake.db, v1Debit(), asChange(planAchTransition(v1Debit(), SETTLED)), {}, NOW, {
    events: [{ organizationId: 109, transactionId: BigInt(501), event: 'charge.succeeded', data: {}, dedupeKey: 'charge.succeeded:501' }],
    subscriptionCancelled: true,
  });
  assert.deepEqual(result, { won: false, outboxIds: [], renewal: null });
  assert.equal(fake.outbox().length, 0);
});

// ── Returned renewals ────────────────────────────────────────────────────────

function renewalWorld(sub: Partial<FakeSubscription>, history: Partial<AchTxRow>[], returningIndex = history.length - 1) {
  const subscription: FakeSubscription = { id: 9, status: 'A', consecutiveFailures: 0, failTrxns: 0, donorId: 77, email: 'donor@example.org', ...sub };
  const rows = history.map((h, i) =>
    v1Debit({
      id: BigInt(600 + i),
      subscriptionId: 9,
      status: 'P',
      statusAch: null,
      fee: '0.88',
      subTotalAmount: '49.12',
      fortisTransactionId: (600 + i).toString(16).padStart(24, '0'),
      createdAt: new Date(Date.UTC(2026, 9, 1 + i)),
      ...h,
    }),
  );
  const fake = createFakeAchDb({
    transactions: rows,
    donors: [{ id: 77, amountAcum: 500, feeAcum: 10, netAcum: 490, firstDate: new Date('2026-01-01') }],
    subscriptions: [subscription],
  });
  return { fake, latest: rows[returningIndex] };
}

test('a returned renewal counts as a failure (failTrxns, consecutiveFailures) but does not cancel on a first R01', async () => {
  const { fake, latest } = renewalWorld({}, [{ status: 'P', statusAch: 'P' }, {}]);
  const result = await commitAchTransition(fake.db, latest, asChange(planAchTransition(latest, RETURNED_R01)), {}, NOW, { events: [], subscriptionCancelled: true });
  assert.equal(result.renewal?.consecutiveFailures, 1);
  assert.equal(result.renewal?.cancelled, false);
  assert.equal(fake.subscription(9).failTrxns, 1);
  assert.equal(fake.subscription(9).consecutiveFailures, 1);
  assert.equal(fake.subscription(9).status, 'A');
  assert.equal(fake.outbox().length, 0); // no payment.failed, no subscription.cancelled
});

test('R02 (and every code NACHA forbids re-debiting) cancels at once and queues subscription.cancelled', async () => {
  const { fake, latest } = renewalWorld({}, [{}]);
  const result = await commitAchTransition(fake.db, latest, asChange(planAchTransition(latest, RETURNED_R02)), {}, NOW, { events: [], subscriptionCancelled: true });
  assert.equal(result.renewal?.cancelled, true);
  assert.equal(result.renewal?.immediate, true);
  assert.equal(fake.subscription(9).status, 'D');
  assert.equal(fake.subscription(9).cancelledAt?.getTime(), NOW.getTime());
  const cancelled = fake.outbox().find((r) => r.event === 'subscription.cancelled');
  assert.ok(cancelled);
  assert.equal(cancelled.dedupeKey, `subscription.cancelled:9:${latest.id}`);
  assert.deepEqual(JSON.parse(cancelled.payload), {
    subscription_id: 9,
    customer_id: 77,
    customer_email: 'donor@example.org',
    reason: 'Auto-cancelled after ACH return R02 (Bank account closed)',
    consecutive_failures: 1,
  });
  assert.equal(fake.outbox().some((r) => r.event === 'payment.failed'), false);

  for (const code of [2103, 2104, 2107, 2108, 2110, 2116, 2120, 2129]) {
    const w = renewalWorld({}, [{}]);
    const outcome = classifyAchTransaction({ status_code: 331, reason_code_id: code });
    const r = await commitAchTransition(w.fake.db, w.latest, asChange(planAchTransition(w.latest, outcome)), {}, NOW, { events: [], subscriptionCancelled: false });
    assert.equal(r.renewal?.cancelled, true, `reason ${code}`);
    assert.equal(w.fake.outbox().length, 0, 'not announced when the debit is not eligible');
  }
});

test('the fourth consecutive failure cancels, even though each accepted debit reset the cron counter', async () => {
  // three earlier renewals came back, the newest is coming back now; the renewal
  // cron reset consecutiveFailures to 0 when the bank accepted each of them
  const { fake, latest } = renewalWorld({ consecutiveFailures: 0 }, [
    { status: 'P', statusAch: 'P' },
    { status: 'N', statusAch: 'F' },
    { status: 'N', statusAch: 'F' },
    { status: 'N', statusAch: 'F' },
    {},
  ]);
  const result = await commitAchTransition(fake.db, latest, asChange(planAchTransition(latest, RETURNED_R01)), {}, NOW, { events: [], subscriptionCancelled: true });
  assert.equal(result.renewal?.consecutiveFailures, 4);
  assert.equal(result.renewal?.cancelled, true);
  assert.equal(fake.subscription(9).status, 'D');
  assert.equal(
    JSON.parse(fake.outbox().find((r) => r.event === 'subscription.cancelled')!.payload).reason,
    'Auto-cancelled after 4 consecutive payment failures',
  );
});

test('a renewal still in flight does not break the streak; a settled one does', async () => {
  // oldest → newest: N, N, N, <returning now>, <newer renewal, still pending>
  const pendingNewer = renewalWorld({}, [{ status: 'N' }, { status: 'N' }, { status: 'N' }, {}, {}], 3);
  const a = await commitAchTransition(pendingNewer.fake.db, pendingNewer.latest, asChange(planAchTransition(pendingNewer.latest, RETURNED_R01)), {}, NOW);
  assert.equal(a.renewal?.consecutiveFailures, 4); // pending skipped, then the return + three earlier failures
  assert.equal(a.renewal?.cancelled, true);
  const settledBetween = renewalWorld({}, [{ status: 'N' }, { status: 'N' }, { status: 'P', statusAch: 'P' }, {}]);
  const b = await commitAchTransition(settledBetween.fake.db, settledBetween.latest, asChange(planAchTransition(settledBetween.latest, RETURNED_R01)), {}, NOW);
  assert.equal(b.renewal?.consecutiveFailures, 1);
  assert.equal(b.renewal?.cancelled, false);
});

test('an already-cancelled subscription is counted but not cancelled again', async () => {
  const { fake, latest } = renewalWorld({ status: 'D' }, [{}]);
  const r = await commitAchTransition(fake.db, latest, asChange(planAchTransition(latest, RETURNED_R02)), {}, NOW, { events: [], subscriptionCancelled: true });
  assert.equal(r.renewal?.cancelled, false);
  assert.equal(fake.outbox().length, 0);
});
