/**
 * The two Fortis webhook routes — the branch against main itself
 * (tests/fixtures/main/*: verbatim copies of origin/main's routes and handler).
 *
 * Every JSON body, and every non-JSON body that does not name an ACH debit,
 * must produce byte-for-byte the same response and the same writes, logs and
 * agency notifications as main. Only a form-encoded Fortis postback naming an
 * ACH (BNK) transaction takes a new path: a throttled re-read from Fortis.
 * Needs module mocks (Node >= 22.3); skips otherwise.
 */
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import type { AchReconcileDeps, AchTxRow } from '@/lib/fortis/ach-settlement';
import { createFakeAchDb } from './support/fake-ach-db';

const supported = typeof (mock as { module?: unknown }).module === 'function';

const CARD_FID = '0000000000000000000000c1';
const CARD_PAID_FID = '0000000000000000000000c2';
const ACH_FID = '0000000000000000000000a1';
const SECRET = 'test-fortis-webhook-secret';

type Rec = { fn: string; args: unknown };

/** Dates differ between the two runs by construction; everything else must not. */
function normalize(value: unknown): unknown {
  if (value instanceof Date) return '<date>';
  if (typeof value === 'bigint') return `${value}n`;
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, normalize(v)]));
  }
  return value;
}

function freshState() {
  return {
    org: {
      id: 61,
      userId: 7,
      fortisOnboarding: { id: 5, appStatus: 'APPROVED', authUserId: null, authUserApiKey: null },
    } as Record<string, unknown> | null,
    transactions: {
      [CARD_FID]: { id: BigInt(6), source: 'CC', status: 'N', statusAch: null, fortisTransactionId: CARD_FID, donorId: 77, totalAmount: '10', fee: '0.59', subTotalAmount: '9.41', donor: { id: 77, firstDate: null } },
      [CARD_PAID_FID]: { id: BigInt(8), source: 'CC', status: 'P', statusAch: null, fortisTransactionId: CARD_PAID_FID, donorId: 77, totalAmount: '10', fee: '0', subTotalAmount: '10', donor: { id: 77, firstDate: null } },
      [ACH_FID]: { id: BigInt(5), source: 'BNK', status: 'U', statusAch: 'W', fortisTransactionId: ACH_FID, donorId: 77, totalAmount: '50', fee: '0', subTotalAmount: '50', donor: { id: 77, firstDate: null } },
    } as Record<string, Record<string, unknown>>,
  };
}

const world = { state: freshState(), writes: [] as Rec[] };
const write = (fn: string, args: unknown) => world.writes.push({ fn, args: normalize(args) });

function achRow(over: Partial<AchTxRow> = {}): AchTxRow {
  return {
    id: BigInt(5), organizationId: 109, donorId: 77, status: 'U', statusAch: 'W', source: 'BNK', fortisTransactionId: ACH_FID,
    totalAmount: '50.00', subTotalAmount: '50.00', fee: '0.00', refundedAmount: '0.00', givingSource: 'api', subscriptionId: null,
    createdAt: new Date('2026-10-14T12:00:00Z'), updatedAt: new Date('2026-10-14T12:00:00Z'), ...over,
  };
}

function form(fields: Record<string, string>) {
  return new URLSearchParams(fields).toString();
}

function postback(record: Record<string, unknown>) {
  return form({ type: 'UPDATE', resource: 'transaction', number_of_attempts: '1', data: JSON.stringify(record) });
}

type Route = { POST: (r: Request) => Promise<Response> };

async function send(route: Route, raw: string, opts: { contentType?: string; sign?: boolean | string } = {}) {
  world.state = freshState();
  world.writes = [];
  const headers: Record<string, string> = { 'content-type': opts.contentType ?? 'application/json' };
  if (opts.sign) {
    headers['x-fortis-signature'] =
      typeof opts.sign === 'string' ? opts.sign : crypto.createHmac('sha256', SECRET).update(raw).digest('hex');
  }
  const original = { error: console.error, log: console.log, warn: console.warn };
  console.error = console.log = console.warn = () => {};
  try {
    const res = await route.POST(new Request('https://app.lunarpay.com/hook', { method: 'POST', headers, body: raw }));
    return { status: res.status, body: await res.text(), writes: world.writes };
  } finally {
    Object.assign(console, original);
  }
}

test('Fortis webhooks: JSON and non-ACH traffic are byte-identical to main', { skip: !supported && 'module mocks need Node >= 22.3' }, async (t) => {
  process.env.FORTIS_WEBHOOK_SECRET = SECRET;

  // ACH re-read path dependencies (branch only)
  const achDb = createFakeAchDb({
    transactions: [achRow()],
    orgs: [{ id: 109, webhookUrl: null, webhookSecret: null, fortisOnboarding: { authUserId: 'u', authUserApiKey: 'k' } }],
  });
  let achNow = new Date('2026-10-20T00:00:00Z');
  let fortisAnswer: Record<string, unknown> = { status_code: 132, reason_code_id: 1000 };
  const fortisReads: string[] = [];
  const achDeps: AchReconcileDeps = {
    db: achDb.db,
    now: () => achNow,
    chargeEventsSince: null,
    async fetchTransaction(_org, id) {
      fortisReads.push(id);
      return { ok: true, transaction: { id, ...fortisAnswer } };
    },
    dispatch() {},
  };

  mock.module('next/server', {
    namedExports: {
      NextResponse: { json: (body: unknown, init?: ResponseInit) => Response.json(body, init) },
      after: (fn: () => unknown) => {
        write('after', null);
        void fn();
      },
    },
  });
  mock.module('@/lib/prisma', {
    namedExports: {
      prisma: {
        fortisWebhook: { create: async (args: unknown) => (write('fortisWebhook.create', args), {}) },
        organization: {
          findUnique: async () => (world.state.org ? JSON.parse(JSON.stringify(world.state.org)) : null),
        },
        fortisOnboarding: {
          update: async (args: unknown) => (write('fortisOnboarding.update', args), {}),
          updateMany: async (args: unknown) => (write('fortisOnboarding.updateMany', args), { count: 1 }),
          findUnique: async () => ({ appStatus: 'APPROVED' }),
        },
        transaction: {
          findFirst: async ({ where }: { where: { fortisTransactionId: string; source?: string } }) => {
            const row = world.state.transactions[where.fortisTransactionId];
            if (!row || (where.source && row.source !== where.source)) return null;
            return { ...row };
          },
          update: async (args: unknown) => (write('transaction.update', args), {}),
        },
        donor: { update: async (args: unknown) => (write('donor.update', args), {}) },
      },
    },
  });
  mock.module('@/lib/payment-logger', {
    namedExports: {
      logWebhookReceived: async (...args: unknown[]) => write('logWebhookReceived', args),
      logPaymentStatusUpdated: async (...args: unknown[]) => write('logPaymentStatusUpdated', args),
    },
  });
  mock.module('@/lib/agency-webhook', {
    namedExports: { notifyAgencyOfStatusChange: async (...args: unknown[]) => write('notifyAgencyOfStatusChange', args) },
  });
  mock.module('@/lib/fortis/onboarding-sync', { namedExports: { PROVISIONING_CLAIM_PREFIX: 'PROVISIONING:' } });
  mock.module('@/lib/fortis/ach-settlement-runtime', { namedExports: { achSettlementDeps: () => achDeps } });

  const mainLegacy = (await import('./fixtures/main/legacy-webhook-route')) as Route;
  const mainSigned = (await import('./fixtures/main/signed-webhook-route')) as Route;
  const branchLegacy = (await import('@/app/fortiswebhooks/merchant_account_status_listener/route')) as unknown as Route;
  const branchSigned = (await import('@/app/api/fortis/webhooks/route')) as unknown as Route;

  const approved = {
    client_app_id: '61',
    stage: 'production',
    users: [{ user_id: 'user-1', user_api_key: 'key-1' }],
    location_id: 'loc-1',
    product_transactions: [{ id: 'cc-1', payment_method: 'cc' }, { id: 'ach-1', payment_method: 'ach' }],
  };
  const identical: Array<[string, string, string?]> = [
    ['onboarding approved', JSON.stringify(approved)],
    ['onboarding approved, labelled as a form', JSON.stringify(approved), 'application/x-www-form-urlencoded'],
    ['onboarding approved, no content type', JSON.stringify(approved), ''],
    ['onboarding declined', JSON.stringify({ client_app_id: '61', status: { response_code: 'declined' } })],
    ['onboarding pended', JSON.stringify({ client_app_id: '61', status: { response_code: 'pended' } })],
    ['onboarding nested under data', JSON.stringify({ stage: 'production', data: approved })],
    ['onboarding for an unknown org', JSON.stringify({ ...approved, client_app_id: '999999' })],
    ['card status JSON (101/1000)', JSON.stringify({ id: CARD_FID, status_code: 101, reason_code_id: 1000 })],
    ['card status JSON with string codes', JSON.stringify({ transaction_id: CARD_PAID_FID, status_code: '101', reason_code_id: '1000' })],
    ['card status JSON labelled as a form', JSON.stringify({ id: CARD_FID, status_code: 301, reason_code_id: 1500 }), 'application/x-www-form-urlencoded'],
    ['postback-shaped JSON', JSON.stringify({ type: 'UPDATE', resource: 'transaction', data: { id: CARD_FID, status_code: 101 } })],
    ['status JSON for an unknown transaction', JSON.stringify({ id: 'ffffffffffffffffffffffff', status_code: 101, reason_code_id: 1000 })],
    ['unknown JSON object', JSON.stringify({ hello: 'world' })],
    ['JSON number', '42'],
    ['JSON null', 'null'],
    ['JSON array', '[]'],
    ['JSON string', '"text"'],
    ['not JSON at all', 'hello world'],
    ['empty body', ''],
    ['form body with a bare id (not a postback)', form({ id: CARD_FID, status_code: '101', reason_code_id: '1000' }), 'application/x-www-form-urlencoded'],
    ['form postback naming a CARD transaction', postback({ id: CARD_FID, status_code: 111, reason_code_id: 1000 }), 'application/x-www-form-urlencoded'],
    ['form postback naming an unknown transaction', postback({ id: 'ffffffffffffffffffffffff', status_code: 134 }), 'application/x-www-form-urlencoded'],
    ['form postback with a malformed id', postback({ id: 'abc', status_code: 134 }), 'application/x-www-form-urlencoded'],
  ];

  for (const [name, raw, contentType] of identical) {
    await t.test(`legacy URL · ${name}`, async () => {
      const expected = await send(mainLegacy, raw, { contentType });
      const actual = await send(branchLegacy, raw, { contentType });
      assert.deepEqual(actual, expected);
    });
    await t.test(`signed URL · ${name}`, async () => {
      const expected = await send(mainSigned, raw, { contentType, sign: true });
      const actual = await send(branchSigned, raw, { contentType, sign: true });
      assert.deepEqual(actual, expected);
    });
  }

  await t.test('the comparison is not vacuous: main really activates, records, rejects', async () => {
    const activated = await send(mainLegacy, JSON.stringify(approved));
    assert.equal(activated.status, 200);
    assert.deepEqual(
      activated.writes.map((w) => w.fn),
      ['fortisWebhook.create', 'logWebhookReceived', 'fortisOnboarding.updateMany', 'after', 'notifyAgencyOfStatusChange'],
    );
    const card = await send(mainLegacy, JSON.stringify({ id: CARD_FID, status_code: 101, reason_code_id: 1000 }));
    assert.deepEqual(card.writes.map((w) => w.fn), ['fortisWebhook.create', 'logWebhookReceived', 'transaction.update', 'donor.update', 'logPaymentStatusUpdated']);
    const junk = await send(mainLegacy, 'hello world');
    assert.deepEqual([junk.status, JSON.parse(junk.body)], [500, { status: false, message: 'Internal server error' }]);
    assert.deepEqual(junk.writes, []);
  });

  await t.test('signed URL · a bad signature is rejected identically', async () => {
    const raw = postback({ id: ACH_FID, status_code: 134 });
    assert.deepEqual(await send(branchSigned, raw, { sign: 'deadbeef' }), await send(mainSigned, raw, { sign: 'deadbeef' }));
    assert.equal(fortisReads.length, 0);
  });

  await t.test('sanity: a card JSON webhook still runs main\'s card logic on the branch', async () => {
    const r = await send(branchLegacy, JSON.stringify({ id: CARD_FID, status_code: 101, reason_code_id: 1000 }));
    assert.equal(r.status, 200);
    assert.ok(r.writes.some((w) => w.fn === 'transaction.update'));
  });

  // ── ACH: intentionally different from main ──
  await t.test('a form postback naming an ACH debit is re-read from Fortis — its claimed status is ignored', async () => {
    const raw = postback({ id: ACH_FID, status_code: 134, reason_code_id: 1000 });
    const r = await send(branchLegacy, raw, { contentType: 'application/x-www-form-urlencoded' });
    assert.equal(r.status, 200);
    assert.equal(JSON.parse(r.body).message, 'ACH transaction unchanged'); // Fortis says still in flight
    assert.deepEqual(fortisReads, [ACH_FID]);
    assert.equal(achDb.tx(5).status, 'U');
    assert.deepEqual(r.writes.map((w) => w.fn), ['logWebhookReceived']); // no card logic, no stored body
    // main answered the same post with a 500
    assert.equal((await send(mainLegacy, raw, { contentType: 'application/x-www-form-urlencoded' })).status, 500);
  });

  await t.test('forged repeats inside a minute do not reach Fortis', async () => {
    const raw = postback({ id: ACH_FID, status_code: 134 });
    for (let i = 0; i < 3; i++) {
      const r = await send(branchLegacy, raw, { contentType: 'application/x-www-form-urlencoded' });
      assert.equal(JSON.parse(r.body).message, 'ACH transaction throttled');
    }
    assert.equal(fortisReads.length, 1);
  });

  await t.test('once Fortis says settled, the next postback (or the JSON shape) settles it', async () => {
    achNow = new Date(achNow.getTime() + 61_000);
    fortisAnswer = { status_code: 134, reason_code_id: 1000 };
    const r = await send(branchSigned, JSON.stringify({ id: ACH_FID, status_code: 101, reason_code_id: 1000 }), { sign: true });
    assert.equal(JSON.parse(r.body).message, 'ACH transaction transitioned');
    assert.equal(achDb.tx(5).status, 'P');
    assert.equal(achDb.tx(5).statusAch, 'P');
    assert.equal(r.writes.some((w) => w.fn === 'transaction.update'), false); // main's card logic not used for ACH
  });
});
