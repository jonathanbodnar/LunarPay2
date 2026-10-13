import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTransactionPostback } from '@/lib/fortis/webhook-body';

const record = { id: '11f0aaaabbbbccccddddeeee', status_code: 331, reason_code_id: 2101, payment_method: 'ach' };
const form = (fields: Record<string, string>) => new URLSearchParams(fields).toString();

test("a Fortis transaction postback (form-encoded, data as a JSON string) yields the record", () => {
  const raw = form({ type: 'UPDATE', resource: 'transaction', number_of_attempts: '1', data: JSON.stringify(record) });
  assert.deepEqual(parseTransactionPostback(raw), record);
  assert.deepEqual(parseTransactionPostback(form({ resource: 'Transactions', data: '{"id":"abc"}' })), { id: 'abc' });
});

test('a form body that is not a transaction postback yields nothing — e.g. a bare id=… body', () => {
  assert.equal(parseTransactionPostback(form({ id: record.id, status_code: '101', reason_code_id: '1000' })), null);
  assert.equal(parseTransactionPostback(form({ resource: 'contact', data: JSON.stringify({ id: 'x' }) })), null);
  assert.equal(parseTransactionPostback(form({ resource: 'transaction', data: 'not-json' })), null);
  assert.equal(parseTransactionPostback(form({ resource: 'transaction', data: '[1,2]' })), null);
  assert.equal(parseTransactionPostback(form({ resource: 'transaction', data: '{}' })), null);
  assert.equal(parseTransactionPostback(form({ resource: 'transaction' })), null);
});

test('JSON and junk are not postbacks (the routes try JSON first anyway)', () => {
  assert.equal(parseTransactionPostback(JSON.stringify({ client_app_id: '61' })), null);
  assert.equal(parseTransactionPostback(''), null);
  assert.equal(parseTransactionPostback('hello world'), null);
});
