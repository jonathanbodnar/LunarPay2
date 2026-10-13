import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFortisWebhookBody, transactionPostbackRecord } from '@/lib/fortis/webhook-body';

test('JSON bodies (onboarding callbacks) parse exactly as before', () => {
  const body = { client_app_id: '61', stage: 'production', users: [{ user_id: 'u' }] };
  assert.deepEqual(parseFortisWebhookBody(JSON.stringify(body), 'application/json'), body);
  assert.deepEqual(parseFortisWebhookBody(JSON.stringify(body), null), body);
});

test('a Fortis transaction postback (form-encoded, data as a JSON string) is decoded', () => {
  const record = { id: '11f0aaaabbbbccccddddeeee', status_code: 331, reason_code_id: 2101, payment_method: 'ach' };
  const raw = new URLSearchParams({
    type: 'UPDATE',
    resource: 'transaction',
    number_of_attempts: '1',
    data: JSON.stringify(record),
  }).toString();
  const parsed = parseFortisWebhookBody(raw, 'application/x-www-form-urlencoded; charset=utf-8');
  assert.deepEqual(parsed, { type: 'UPDATE', resource: 'transaction', number_of_attempts: '1', data: record });
  assert.deepEqual(transactionPostbackRecord(parsed), record);
  // a missing content-type still falls back to the form reading
  assert.deepEqual(transactionPostbackRecord(parseFortisWebhookBody(raw, undefined)), record);
});

test('unreadable bodies yield null rather than throwing', () => {
  assert.equal(parseFortisWebhookBody('', 'application/json'), null);
  assert.equal(parseFortisWebhookBody('not json at all', 'application/json'), null);
  assert.equal(parseFortisWebhookBody('[1,2]', 'application/json'), null);
  assert.equal(parseFortisWebhookBody('42', null), null);
});

test('only transaction postbacks with a record id are routed as transactions', () => {
  assert.equal(transactionPostbackRecord({ resource: 'contact', data: { id: 'x' } }), null);
  assert.equal(transactionPostbackRecord({ resource: 'transaction', data: 'not-json' }), null);
  assert.equal(transactionPostbackRecord({ resource: 'transaction', data: {} }), null);
  assert.equal(transactionPostbackRecord({ client_app_id: '5' }), null);
  assert.equal(transactionPostbackRecord(null), null);
  assert.deepEqual(transactionPostbackRecord({ resource: 'Transactions', data: { id: 'abc' } }), { id: 'abc' });
});
