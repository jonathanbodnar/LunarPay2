/**
 * lib/fortis/webhook-handler.ts end to end, with Next.js, Prisma and the
 * logging/agency modules replaced by module mocks and the ACH settlement deps
 * by the in-memory fake. Needs Node >= 22.3 (module mocks); skips otherwise.
 */
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import type { AchReconcileDeps, AchTxRow, ChargeEventName } from '@/lib/fortis/ach-settlement';
import { parseFortisWebhookBody } from '@/lib/fortis/webhook-body';
import { createFakeAchDb } from './support/fake-ach-db';

const supported = typeof (mock as { module?: unknown }).module === 'function';

const ACH_FID = '0000000000000000000000a1';
const CARD_FID = '0000000000000000000000c1';

function achRow(): AchTxRow {
  return {
    id: BigInt(5),
    organizationId: 109,
    donorId: 77,
    status: 'U',
    statusAch: 'W',
    source: 'BNK',
    fortisTransactionId: ACH_FID,
    totalAmount: '50.00',
    subTotalAmount: '50.00',
    fee: '0.00',
    refundedAmount: '0.00',
    givingSource: 'api',
    subscriptionId: null,
    createdAt: new Date('2026-10-01T00:00:00Z'),
    updatedAt: new Date('2026-10-01T00:00:00Z'),
  };
}

function postback(record: Record<string, unknown>) {
  const raw = new URLSearchParams({ type: 'UPDATE', resource: 'transaction', number_of_attempts: '1', data: JSON.stringify(record) }).toString();
  return parseFortisWebhookBody(raw, 'application/x-www-form-urlencoded');
}

test('Fortis transaction webhooks', { skip: !supported && 'module mocks need Node >= 22.3' }, async (t) => {
  // ── fakes ──
  const fortisState: Record<string, Record<string, unknown>> = { [ACH_FID]: { status_code: 132, reason_code_id: 1000 } };
  const ach = createFakeAchDb({
    transactions: [achRow()],
    donors: [{ id: 77, amountAcum: 50, feeAcum: 0, netAcum: 0, firstDate: null }],
    orgs: [{ id: 109, webhookUrl: 'https://receiver.example/hook', webhookSecret: 's', fortisOnboarding: { authUserId: 'u', authUserApiKey: 'k' } }],
  });
  const events: { event: ChargeEventName; data: Record<string, unknown> }[] = [];
  const fortisReads: string[] = [];
  const deps: AchReconcileDeps = {
    db: ach.db,
    async fetchTransaction(_org, id) {
      fortisReads.push(id);
      return { ok: true, transaction: { id, ...fortisState[id] } };
    },
    deliver(_org, event, data) {
      events.push({ event, data });
    },
  };

  // what the legacy handler's own Prisma calls see
  const ledger: Record<string, Record<string, unknown>> = {
    [ACH_FID]: { ...achRow(), donor: { firstDate: null } },
    [CARD_FID]: { id: BigInt(6), source: 'CC', status: 'N', statusAch: null, fortisTransactionId: CARD_FID, donorId: 0, totalAmount: '10', fee: '0', subTotalAmount: '10', donor: null },
  };
  const legacyUpdates: Array<Record<string, unknown>> = [];

  mock.module('next/server', {
    namedExports: {
      NextResponse: { json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }) },
      after: (fn: () => unknown) => {
        fn();
      },
    },
  });
  mock.module('@/lib/prisma', {
    namedExports: {
      prisma: {
        transaction: {
          findFirst: async ({ where }: { where: { fortisTransactionId: string } }) => ledger[where.fortisTransactionId] ?? null,
          update: async (args: Record<string, unknown>) => {
            legacyUpdates.push(args);
            return {};
          },
        },
        donor: { update: async () => ({}) },
      },
    },
  });
  mock.module('@/lib/payment-logger', {
    namedExports: { logWebhookReceived: async () => {}, logPaymentStatusUpdated: async () => {} },
  });
  mock.module('@/lib/agency-webhook', { namedExports: { notifyAgencyOfStatusChange: async () => {} } });
  mock.module('@/lib/fortis/onboarding-sync', { namedExports: { PROVISIONING_CLAIM_PREFIX: 'PROVISIONING:' } });
  mock.module('@/lib/fortis/ach-settlement-runtime', { namedExports: { achSettlementDeps: () => deps } });

  const { routeWebhook } = (await import('@/lib/fortis/webhook-handler')) as unknown as {
    routeWebhook: (body: unknown) => Promise<{ body: { status: boolean; message: string }; status: number }>;
  };

  await t.test('an ACH postback claiming success is re-read from Fortis — still in flight, nothing changes', async () => {
    const res = await routeWebhook(postback({ id: ACH_FID, status_code: 101, reason_code_id: 1000 }));
    assert.equal(res.status, 200);
    assert.equal(res.body.message, 'ACH transaction unchanged');
    assert.deepEqual(fortisReads, [ACH_FID]);
    assert.equal(ach.tx(5).status, 'U');
    assert.equal(events.length, 0);
    assert.equal(legacyUpdates.length, 0); // the card logic never touched the ACH row
  });

  await t.test('once Fortis says settled, the postback settles it and sends charge.succeeded once', async () => {
    fortisState[ACH_FID] = { status_code: 134, reason_code_id: 1000 };
    const first = await routeWebhook(postback({ id: ACH_FID, status_code: 134 }));
    assert.equal(first.body.message, 'ACH transaction transitioned');
    assert.equal(ach.tx(5).status, 'P');
    assert.equal(ach.tx(5).statusAch, 'P');
    // a redelivery (or the cron racing it) finds nothing left to do
    const again = await routeWebhook(postback({ id: ACH_FID, status_code: 134 }));
    assert.equal(again.body.message, 'ACH transaction unchanged');
    assert.deepEqual(events.map((e) => [e.event, e.data.status]), [['charge.succeeded', 'paid']]);
  });

  await t.test('the legacy top-level JSON shape takes the same ACH path', async () => {
    fortisState[ACH_FID] = { status_code: 331, reason_code_id: 2101 };
    const res = await routeWebhook({ id: ACH_FID, status_code: 101, reason_code_id: 1000 });
    assert.equal(res.body.message, 'ACH transaction transitioned');
    assert.equal(ach.tx(5).status, 'N');
    assert.deepEqual(events.map((e) => e.event), ['charge.succeeded', 'charge.failed']);
    assert.equal(events[1].data.error, 'ACH return R01: Insufficient funds');
  });

  await t.test('a card postback is acknowledged but not processed (card logic unreachable from the new format)', async () => {
    const res = await routeWebhook(postback({ id: CARD_FID, status_code: 111, reason_code_id: 1000 }));
    assert.equal(res.status, 200);
    assert.equal(res.body.message, 'Card transaction postback acknowledged; not processed');
    assert.equal(legacyUpdates.length, 0);
  });

  await t.test('the legacy top-level JSON card webhook behaves exactly as before', async () => {
    const res = await routeWebhook({ id: CARD_FID, status_code: 101, reason_code_id: 1000 });
    assert.equal(res.body.message, 'Transaction status webhook processed');
    assert.equal(legacyUpdates.length, 1);
    assert.equal((legacyUpdates[0].data as { status: string }).status, 'P');
  });
});
