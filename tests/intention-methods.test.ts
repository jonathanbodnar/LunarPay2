import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createAchTokenizationIntention,
  distinctAchProduct,
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

test("['ach'] sends methods: [{ type: 'ach', product_transaction_id }] and nothing else", async () => {
  const { client, sent } = fakeClient([{ status: true, clientToken: 'tok' }]);
  const result = await createAchTokenizationIntention(client, { locationId: 'loc-1', products });
  assert.deepEqual(sent, [
    { location_id: 'loc-1', action: 'tokenization', methods: [{ type: 'ach', product_transaction_id: 'ach-product-id' }] },
  ]);
  assert.deepEqual(result, { ok: true, clientToken: 'tok' });
});

test('no ACH product on file → ACH_NOT_ENABLED, Fortis never called', async () => {
  const { client, sent } = fakeClient([{ status: true, clientToken: 'tok' }]);
  const result = await createAchTokenizationIntention(client, {
    locationId: 'loc-1',
    products: { ccProductTransactionId: 'cc', achProductTransactionId: null },
  });
  assert.equal(sent.length, 0);
  assert.deepEqual(result, {
    ok: false,
    status: 400,
    code: 'ACH_NOT_ENABLED',
    error: 'ACH (eCheck) processing is not enabled for this merchant. Contact support to enable an ACH product.',
  });
});

test('an "ACH" id equal to the card id (stored as cc || ach) is never sent as the ACH product', async () => {
  const { client, sent } = fakeClient([{ status: true, clientToken: 'tok' }]);
  const result = await createAchTokenizationIntention(client, {
    locationId: 'loc-1',
    products: { ccProductTransactionId: 'same-id', achProductTransactionId: 'same-id' },
  });
  assert.equal(sent.length, 0);
  assert.equal(result.ok, false);
  assert.equal(!result.ok && result.code, 'ACH_NOT_ENABLED');
  assert.equal(distinctAchProduct({ ccProductTransactionId: ' x ', achProductTransactionId: 'x' }), null);
  assert.equal(distinctAchProduct({ ccProductTransactionId: null, achProductTransactionId: 'x' }), 'x');
});

test('Fortis refusing methods → 422 ACH_METHODS_UNSUPPORTED, and never an unscoped retry', async () => {
  const { client, sent } = fakeClient([
    { status: false, message: '"methods" is not allowed' },
    { status: true, clientToken: 'unscoped-token-must-not-be-used' },
  ]);
  const original = console.error;
  console.error = () => {};
  try {
    const result = await createAchTokenizationIntention(client, { locationId: 'loc-1', products, organizationId: 7 });
    assert.equal(sent.length, 1);
    assert.deepEqual(result, {
      ok: false,
      status: 422,
      code: 'ACH_METHODS_UNSUPPORTED',
      error: 'A bank-account-only payment form is not available for this merchant right now.',
    });
  } finally {
    console.error = original;
  }
});

test('any other Fortis failure → 400 ACH_INTENTION_FAILED with its message', async () => {
  const { client, sent } = fakeClient([{ status: false, message: 'Unauthorized' }]);
  assert.deepEqual(await createAchTokenizationIntention(client, { locationId: 'l', products }), {
    ok: false,
    status: 400,
    code: 'ACH_INTENTION_FAILED',
    error: 'Unauthorized',
  });
  assert.equal(sent.length, 1);
  const none = fakeClient([{ status: true }]); // "ok" with no token is still a failure
  const r = await createAchTokenizationIntention(none.client, { locationId: 'l', products });
  assert.deepEqual(r, { ok: false, status: 400, code: 'ACH_INTENTION_FAILED', error: 'Failed to create tokenization intention' });
});

test('isMethodsRejection recognises Fortis refusing the methods field only', () => {
  assert.equal(isMethodsRejection('"methods" is not allowed'), true);
  assert.equal(isMethodsRejection('"methods[0].product_transaction_id" is not allowed'), true);
  assert.equal(isMethodsRejection('methods is not permitted'), true);
  assert.equal(isMethodsRejection('"product_transaction_id" is not allowed'), false);
  assert.equal(isMethodsRejection('Unauthorized'), false);
  assert.equal(isMethodsRejection(undefined), false);
  assert.equal(isMethodsRejection(''), false);
});
