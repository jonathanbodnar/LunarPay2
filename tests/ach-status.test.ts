import { test } from 'node:test';
import assert from 'node:assert/strict';
import { achReturnCode, classifyAchTransaction } from '@/lib/fortis/ach-status';

test('131/132/133 are still in flight — pending, never a failure', () => {
  for (const code of [131, 132, 133]) {
    assert.deepEqual(classifyAchTransaction({ status_code: code, reason_code_id: 1000 }), { kind: 'pending', statusCode: code });
  }
});

test('134 settled (the shape of a real production ACH debit)', () => {
  const record = {
    status_code: 134,
    reason_code_id: 1000,
    type_id: 50,
    payment_method: 'ach',
    settle_date: '2025-12-08 00:00:00',
    return_date: null,
    charge_back_date: null,
    verbiage: 'Transaction Received',
  };
  assert.deepEqual(classifyAchTransaction(record), { kind: 'settled', statusCode: 134 });
});

test('331 charged back with R01 → returned, code and description in the message', () => {
  assert.deepEqual(classifyAchTransaction({ status_code: 331, reason_code_id: 2101 }), {
    kind: 'failed',
    reason: 'returned',
    statusCode: 331,
    reasonCodeId: 2101,
    returnCode: 'R01',
    message: 'ACH return R01: Insufficient funds',
  });
});

test('a return reason wins over a settled status — a returned debit is never "settled"', () => {
  const outcome = classifyAchTransaction({ status_code: 134, reason_code_id: 2102 });
  assert.equal(outcome.kind, 'failed');
  assert.equal(outcome.kind === 'failed' && outcome.returnCode, 'R02');
  assert.equal(outcome.kind === 'failed' && outcome.message, 'ACH return R02: Bank account closed');
});

test('only a real date counts as a return date', () => {
  for (const notADate of [0, '0', '', '  ', '0000-00-00', '0000-00-00 00:00:00', 'null', 'N/A', 1765195663, '2026-02-30', '1999-12-31']) {
    assert.equal(
      classifyAchTransaction({ status_code: 134, reason_code_id: 1000, return_date: notADate, charge_back_date: notADate }).kind,
      'settled',
      `return_date ${JSON.stringify(notADate)} must not read as a return`,
    );
  }
  for (const date of ['2026-10-01', '2026-10-01 00:00:00', '2026-10-01T12:30:00Z']) {
    assert.equal(classifyAchTransaction({ status_code: 134, return_date: date }).kind, 'failed');
    assert.equal(classifyAchTransaction({ status_code: 134, charge_back_date: date }).kind, 'failed');
  }
});

test('a return date alone is treated as a return', () => {
  const outcome = classifyAchTransaction({ status_code: 134, reason_code_id: 1000, return_date: '2026-10-01' });
  assert.equal(outcome.kind, 'failed');
  assert.equal(outcome.kind === 'failed' && outcome.reason, 'returned');
  assert.equal(outcome.kind === 'failed' && outcome.returnCode, null);
  assert.equal(outcome.kind === 'failed' && outcome.message, 'ACH debit was returned by the bank');
});

test('331 without a recognised reason is still a return', () => {
  const outcome = classifyAchTransaction({ status_code: 331, reason_code_id: 1000 });
  assert.equal(outcome.kind === 'failed' && outcome.reason, 'returned');
});

test('201 voided, and reason 2200 (processor void) → voided', () => {
  assert.equal(classifyAchTransaction({ status_code: 201, reason_code_id: 1200 }).kind, 'failed');
  const v = classifyAchTransaction({ status_code: 201, reason_code_id: 2200 });
  assert.equal(v.kind === 'failed' && v.reason, 'voided');
  const pv = classifyAchTransaction({ status_code: 131, reason_code_id: 2200 });
  assert.equal(pv.kind === 'failed' && pv.reason, 'voided');
});

test('301 declined, with the ACH reason when Fortis documents one', () => {
  const d = classifyAchTransaction({ status_code: 301, reason_code_id: 1640 });
  assert.equal(d.kind === 'failed' && d.reason, 'declined');
  assert.equal(d.kind === 'failed' && d.message, 'ACH debit was declined: Required fields are missing (ACH only)');
  const unknownReason = classifyAchTransaction({ status_code: 301, reason_code_id: 1999 });
  assert.equal(unknownReason.kind === 'failed' && unknownReason.message, 'ACH debit was declined (reason 1999)');
});

test('a notification of change (C-code) does not fail a settled debit', () => {
  assert.equal(classifyAchTransaction({ status_code: 134, reason_code_id: 2201 }).kind, 'settled');
  assert.equal(achReturnCode(2201), null);
});

test('card codes and anything unrecognised are unknown — callers leave the row alone', () => {
  assert.equal(classifyAchTransaction({ status_code: 101, reason_code_id: 1000 }).kind, 'unknown');
  assert.equal(classifyAchTransaction({ status_code: 999, reason_code_id: 999 }).kind, 'unknown');
  assert.equal(classifyAchTransaction({}).kind, 'unknown');
});

test('string codes (form-encoded postbacks) and the legacy status_id name are read', () => {
  assert.equal(classifyAchTransaction({ status_code: '134', reason_code_id: '1000' }).kind, 'settled');
  assert.equal(classifyAchTransaction({ status_id: 133 }).kind, 'pending');
  const r = classifyAchTransaction({ status_code: '331', reason_code_id: '2110' });
  assert.equal(r.kind === 'failed' && r.returnCode, 'R10');
});

test('achReturnCode maps the documented ranges', () => {
  assert.equal(achReturnCode(2101), 'R01');
  assert.equal(achReturnCode(2183), 'R83');
  assert.equal(achReturnCode(2301), 'X01');
  assert.equal(achReturnCode(2373), 'X73');
  assert.equal(achReturnCode(2200), null);
  assert.equal(achReturnCode(1000), null);
  assert.equal(achReturnCode(null), null);
});
