import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createTokenizationIntention,
  intentionMethodsFor,
  isMethodsRejection,
  type IntentionClient,
} from '@/lib/fortis/intention-methods';
import type { TransactionIntentionData } from '@/types/fortis';

const products = { ccProductTransactionId: 'cc-product-id', achProductTransactionId: 'ach-product-id' };

/** Records every body sent to Fortis; answers from a script. */
function fakeClient(answers: Array<{ status: boolean; clientToken?: string; message?: string }>) {
  const sent: TransactionIntentionData[] = [];
  const client: IntentionClient = {
    async createTransactionIntention(data) {
      sent.push(JSON.parse(JSON.stringify(data)));
      return answers[Math.min(sent.length - 1, answers.length - 1)];
    },
  };
  return { client, sent };
}

test("['cc','ach'] / omitted (rail 'any') sends no methods at all — exactly as before", () => {
  const scope = intentionMethodsFor('any', products);
  assert.deepEqual(scope, { ok: true });
  // and the field is absent, not undefined-valued, once spread into the body
  const body = { location_id: 'loc', action: 'tokenization', ...(scope.ok && scope.methods ? { methods: scope.methods } : {}) };
  assert.deepEqual(Object.keys(body), ['location_id', 'action']);
});

test("['ach'] limits the intention to the ACH product", () => {
  assert.deepEqual(intentionMethodsFor('ach', products), {
    ok: true,
    methods: [{ type: 'ach', product_transaction_id: 'ach-product-id' }],
  });
});

test("['cc'] limits the intention to the card product", () => {
  assert.deepEqual(intentionMethodsFor('cc', products), {
    ok: true,
    methods: [{ type: 'cc', product_transaction_id: 'cc-product-id' }],
  });
});

test('a rail the merchant has no product for is refused with the same message as the sale path', () => {
  const ach = intentionMethodsFor('ach', { ...products, achProductTransactionId: null });
  assert.equal(ach.ok, false);
  assert.match((ach as { error: string }).error, /ACH \(eCheck\) processing is not enabled/);
  const cc = intentionMethodsFor('cc', { ...products, ccProductTransactionId: null });
  assert.equal(cc.ok, false);
  assert.match((cc as { error: string }).error, /Credit card processing is not enabled/);
  // 'any' never needs a product id
  assert.deepEqual(intentionMethodsFor('any', { ccProductTransactionId: null, achProductTransactionId: null }), { ok: true });
});

test('isMethodsRejection recognises Fortis refusing the methods field only', () => {
  assert.equal(isMethodsRejection('"methods" is not allowed'), true);
  assert.equal(isMethodsRejection('"methods[0].product_transaction_id" is not allowed'), true);
  assert.equal(isMethodsRejection('methods is not permitted'), true);
  // other failures must surface, not silently degrade
  assert.equal(isMethodsRejection('"product_transaction_id" is not allowed'), false);
  assert.equal(isMethodsRejection('Unauthorized'), false);
  assert.equal(isMethodsRejection('Product transaction not found'), false);
  assert.equal(isMethodsRejection(undefined), false);
  assert.equal(isMethodsRejection(''), false);
});

test("tokenization with ['ach'] sends methods: [{ type: 'ach', product_transaction_id }] to Fortis", async () => {
  const { client, sent } = fakeClient([{ status: true, clientToken: 'tok' }]);
  const result = await createTokenizationIntention(client, { locationId: 'loc-1', rail: 'ach', products });
  assert.deepEqual(sent, [
    { location_id: 'loc-1', action: 'tokenization', methods: [{ type: 'ach', product_transaction_id: 'ach-product-id' }] },
  ]);
  assert.deepEqual(result, { ok: true, clientToken: 'tok', productTransactionId: 'ach-product-id', methodsEnforced: true });
});

test("tokenization with ['cc','ach'] or omitted sends the same body as before and the same response fields", async () => {
  const { client, sent } = fakeClient([{ status: true, clientToken: 'tok' }]);
  const result = await createTokenizationIntention(client, { locationId: 'loc-1', rail: 'any', products });
  assert.deepEqual(sent, [{ location_id: 'loc-1', action: 'tokenization' }]);
  // no methodsEnforced key at all, productTransactionId null — as before
  assert.deepEqual(result, { ok: true, clientToken: 'tok', productTransactionId: null });
});

test('if Fortis refuses methods, fall back to the unscoped form and report methodsEnforced: false', async () => {
  const { client, sent } = fakeClient([
    { status: false, message: '"methods" is not allowed' },
    { status: true, clientToken: 'tok-unscoped' },
  ]);
  const result = await createTokenizationIntention(client, { locationId: 'loc-1', rail: 'ach', products, organizationId: 7 });
  assert.equal(sent.length, 2);
  assert.deepEqual(sent[1], { location_id: 'loc-1', action: 'tokenization' });
  assert.deepEqual(result, { ok: true, clientToken: 'tok-unscoped', productTransactionId: null, methodsEnforced: false });
});

test('any other Fortis failure is returned as-is (no silent retry)', async () => {
  const { client, sent } = fakeClient([{ status: false, message: 'Unauthorized' }]);
  const result = await createTokenizationIntention(client, { locationId: 'loc-1', rail: 'ach', products });
  assert.equal(sent.length, 1);
  assert.deepEqual(result, { ok: false, error: 'Unauthorized' });

  const none = fakeClient([{ status: false }]);
  assert.deepEqual(await createTokenizationIntention(none.client, { locationId: 'l', rail: 'any', products }), {
    ok: false,
    error: 'Failed to create tokenization intention',
  });
});

test('a rail without a product id never reaches Fortis', async () => {
  const { client, sent } = fakeClient([{ status: true, clientToken: 'tok' }]);
  const result = await createTokenizationIntention(client, {
    locationId: 'loc-1',
    rail: 'ach',
    products: { ccProductTransactionId: 'cc', achProductTransactionId: null },
  });
  assert.equal(sent.length, 0);
  assert.equal(result.ok, false);
});
