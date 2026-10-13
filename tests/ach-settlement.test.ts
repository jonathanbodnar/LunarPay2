import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  achWatchPhase,
  chargeEventPayload,
  commitAchTransition,
  planAchTransition,
  type AchStateChange,
  type AchTxRow,
} from '@/lib/fortis/ach-settlement';
import { classifyAchTransaction } from '@/lib/fortis/ach-status';
import { createFakeAchDb } from './support/fake-ach-db';

const FORTIS_ID = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const SETTLED = classifyAchTransaction({ status_code: 134, reason_code_id: 1000 });
const RETURNED_R01 = classifyAchTransaction({ status_code: 331, reason_code_id: 2101 });
const VOIDED = classifyAchTransaction({ status_code: 201, reason_code_id: 2200 });
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
    createdAt: new Date('2026-10-01T12:00:00Z'),
    updatedAt: new Date('2026-10-01T12:00:00Z'),
    ...over,
  };
}

function asChange(t: ReturnType<typeof planAchTransition>): AchStateChange {
  assert.notEqual(t.kind, 'none');
  return t as AchStateChange;
}

// ── Which rows are watched ───────────────────────────────────────────────────

test('watch phase: waiting debits in every shape the writers leave them', () => {
  assert.equal(achWatchPhase(v1Debit()), 'pending'); // POST /v1/charges after this change
  assert.equal(achWatchPhase(v1Debit({ statusAch: null })), 'pending'); // POST /v1/charges before it, hosted checkout
  assert.equal(achWatchPhase(v1Debit({ status: 'P', statusAch: null, subscriptionId: 9 })), 'pending'); // recurring ACH
  assert.equal(achWatchPhase(v1Debit({ status: 'P', statusAch: 'W' })), 'pending'); // dashboard charge
  assert.equal(achWatchPhase(v1Debit({ statusAch: 'pending' })), 'pending');
  assert.equal(achWatchPhase(v1Debit({ status: 'P', statusAch: 'P' })), 'settled');
});

test('watch phase: final rows, card rows, imports and foreign ids are never touched', () => {
  assert.equal(achWatchPhase(v1Debit({ status: 'N', statusAch: 'F' })), null);
  assert.equal(achWatchPhase(v1Debit({ status: 'N', statusAch: 'W' })), null); // failed at submission
  assert.equal(achWatchPhase(v1Debit({ status: 'N', statusAch: null })), null);
  assert.equal(achWatchPhase(v1Debit({ status: 'V', statusAch: 'F' })), null);
  assert.equal(achWatchPhase(v1Debit({ status: 'R', statusAch: 'P' })), null);
  assert.equal(achWatchPhase(v1Debit({ source: 'CC' })), null);
  assert.equal(achWatchPhase(v1Debit({ givingSource: 'fortis_import', status: 'P', statusAch: null })), null);
  assert.equal(achWatchPhase(v1Debit({ givingSource: 'stripe_import', fortisTransactionId: 'py_1234567890abcdefghijkl' })), null);
  assert.equal(achWatchPhase(v1Debit({ fortisTransactionId: null })), null);
  assert.equal(achWatchPhase(v1Debit({ fortisTransactionId: 'abc123' })), null);
});

// ── Transitions + donor running totals ───────────────────────────────────────

test('v1 charge settles: U/W → P/P, charge.succeeded, totals untouched (already counted at creation)', () => {
  const change = asChange(planAchTransition(v1Debit(), SETTLED));
  assert.equal(change.kind, 'settle');
  assert.deepEqual(change.from, { status: 'U', statusAch: 'W' });
  assert.deepEqual(change.to, { status: 'P', statusAch: 'P' });
  assert.equal(change.event, 'charge.succeeded');
  assert.equal(change.donorDelta, null);
});

test('v1 charge returned: U/W → N/F, charge.failed, amount_acum taken back (only what v1 added)', () => {
  const change = asChange(planAchTransition(v1Debit(), RETURNED_R01));
  assert.equal(change.kind, 'fail');
  assert.deepEqual(change.to, { status: 'N', statusAch: 'F' });
  assert.equal(change.event, 'charge.failed');
  assert.deepEqual(change.donorDelta, { amount: -50, fee: 0, net: 0, setFirstDate: false });
});

test('a voided debit is recorded as V', () => {
  const change = asChange(planAchTransition(v1Debit(), VOIDED));
  assert.deepEqual(change.to, { status: 'V', statusAch: 'F' });
  assert.equal(change.event, 'charge.failed');
});

test('payment-link debit (not counted while pending): settle adds all three totals + first date; a failure adds nothing', () => {
  const link = v1Debit({ givingSource: 'payment_link', totalAmount: '100.00', fee: '3.20', subTotalAmount: '96.80' });
  assert.deepEqual(asChange(planAchTransition(link, SETTLED)).donorDelta, { amount: 100, fee: 3.2, net: 96.8, setFirstDate: true });
  assert.equal(asChange(planAchTransition(link, RETURNED_R01)).donorDelta, null);
});

test('hosted checkout debit (counted while pending): settle adds nothing, a return takes all three back', () => {
  const checkout = v1Debit({ givingSource: 'checkout', statusAch: null, totalAmount: '20.00', fee: '0.76', subTotalAmount: '19.24' });
  assert.equal(asChange(planAchTransition(checkout, SETTLED)).donorDelta, null);
  assert.deepEqual(asChange(planAchTransition(checkout, RETURNED_R01)).donorDelta, { amount: -20, fee: -0.76, net: -19.24, setFirstDate: false });
});

test('recurring ACH (recorded P at creation): settle marks status_ach only; a return takes all three back', () => {
  const recurring = v1Debit({ status: 'P', statusAch: null, subscriptionId: 9, totalAmount: '25.00', fee: '0.88', subTotalAmount: '24.12' });
  const settle = asChange(planAchTransition(recurring, SETTLED));
  assert.deepEqual(settle.to, { status: 'P', statusAch: 'P' });
  assert.equal(settle.donorDelta, null);
  assert.deepEqual(asChange(planAchTransition(recurring, RETURNED_R01)).donorDelta, { amount: -25, fee: -0.88, net: -24.12, setFirstDate: false });
});

test('installment ACH (givingSource api, with a fee) is not mistaken for a v1 charge', () => {
  const installment = v1Debit({ status: 'P', statusAch: null, fee: '1.45', subTotalAmount: '48.55' });
  assert.deepEqual(asChange(planAchTransition(installment, RETURNED_R01)).donorDelta, { amount: -50, fee: -1.45, net: -48.55, setFirstDate: false });
});

test('settled debit: re-settling is a no-op; a late return fails it, net of any partial refund', () => {
  const settled = v1Debit({ status: 'P', statusAch: 'P', refundedAmount: '10.00' });
  assert.equal(planAchTransition(settled, SETTLED).kind, 'none');
  const late = asChange(planAchTransition(settled, RETURNED_R01));
  assert.deepEqual(late.from, { status: 'P', statusAch: 'P' });
  assert.deepEqual(late.to, { status: 'N', statusAch: 'F' });
  assert.deepEqual(late.donorDelta, { amount: -40, fee: 0, net: 0, setFirstDate: false });
});

test('still in flight, unknown codes, and final rows change nothing', () => {
  assert.equal(planAchTransition(v1Debit(), IN_FLIGHT).kind, 'none');
  assert.equal(planAchTransition(v1Debit(), classifyAchTransaction({ status_code: 999 })).kind, 'none');
  assert.equal(planAchTransition(v1Debit({ status: 'N', statusAch: 'F' }), SETTLED).kind, 'none');
  assert.equal(planAchTransition(v1Debit({ status: 'N', statusAch: 'F' }), RETURNED_R01).kind, 'none');
});

// ── Event payloads ───────────────────────────────────────────────────────────

test('charge.succeeded has exactly the keys POST /v1/charges sends, with status paid', () => {
  const change = asChange(planAchTransition(v1Debit(), SETTLED));
  const { event, data } = chargeEventPayload(v1Debit(), change, { paymentMethodId: 12, description: 'Tithe' });
  assert.equal(event, 'charge.succeeded');
  assert.deepEqual(Object.keys(data), [
    'transaction_id', 'customer_id', 'payment_method_id', 'amount_cents', 'currency',
    'payment_method', 'status', 'captured', 'fortis_transaction_id', 'description',
  ]);
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

test('charge.failed carries the return reason in error, plus status / return_code / fortis_transaction_id', () => {
  const change = asChange(planAchTransition(v1Debit(), RETURNED_R01));
  const { event, data } = chargeEventPayload(v1Debit(), change, { paymentMethodId: null, description: null });
  assert.equal(event, 'charge.failed');
  assert.deepEqual(data, {
    transaction_id: '501',
    customer_id: 77,
    payment_method_id: null,
    amount_cents: 5000,
    currency: 'USD',
    payment_method: 'ach',
    status: 'failed',
    error: 'ACH return R01: Insufficient funds',
    return_code: 'R01',
    fortis_transaction_id: FORTIS_ID,
    description: null,
  });
  const voided = chargeEventPayload(v1Debit(), asChange(planAchTransition(v1Debit(), VOIDED)), { paymentMethodId: null, description: null });
  assert.equal(voided.data.status, 'voided');
  assert.equal(voided.data.error, 'ACH debit was voided before it reached the bank');
});

// ── The conditional write ────────────────────────────────────────────────────

test('commit is compare-and-set: only the first of two identical commits lands, totals move once', async () => {
  const fake = createFakeAchDb({
    transactions: [v1Debit()],
    donors: [{ id: 77, amountAcum: 50, feeAcum: 0, netAcum: 0, firstDate: new Date('2026-01-01') }],
  });
  const change = asChange(planAchTransition(v1Debit(), RETURNED_R01));
  const now = new Date('2026-10-05T00:00:00Z');
  const [a, b] = await Promise.all([
    commitAchTransition(fake.db, v1Debit(), change, { status_code: 331 }, now),
    commitAchTransition(fake.db, v1Debit(), change, { status_code: 331 }, now),
  ]);
  assert.deepEqual([a, b].sort(), [false, true]);
  assert.equal(fake.tx(501).status, 'N');
  assert.equal(fake.tx(501).statusAch, 'F');
  assert.equal(fake.donor(77).amountAcum, 0);
  assert.equal(JSON.parse((fake.tx(501) as unknown as { requestResponse: string }).requestResponse).status_code, 331);
});

test('commit sets firstDate only when the donor has none, and tolerates a guest row', async () => {
  const link = v1Debit({ givingSource: 'payment_link', id: BigInt(900) });
  const fake = createFakeAchDb({
    transactions: [link, v1Debit({ givingSource: 'payment_link', id: BigInt(901), donorId: 0 })],
    donors: [{ id: 77, amountAcum: 0, feeAcum: 0, netAcum: 0, firstDate: null }],
  });
  const now = new Date('2026-10-05T00:00:00Z');
  assert.equal(await commitAchTransition(fake.db, link, asChange(planAchTransition(link, SETTLED)), {}, now), true);
  assert.deepEqual(fake.donor(77), { id: 77, amountAcum: 50, feeAcum: 0, netAcum: 50, firstDate: now });
  const guest = fake.tx(901);
  assert.equal(await commitAchTransition(fake.db, guest, asChange(planAchTransition(guest, SETTLED)), {}, now), true);
  assert.equal(fake.tx(901).status, 'P');
});
