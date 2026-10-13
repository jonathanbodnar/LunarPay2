import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  OUTBOX_BACKOFF_MS,
  OUTBOX_LEASE_MS,
  OUTBOX_MAX_ATTEMPTS,
  deliverOutboxEntries,
  deliverOutboxEntry,
  dueOutboxIds,
  type OutboxDeps,
} from '@/lib/webhook-outbox';
import { createFakeAchDb, type FakeOutboxRow } from './support/fake-ach-db';

const T0 = new Date('2026-10-20T00:00:00Z');
const MIN = 60_000;

function row(id: number, over: Partial<FakeOutboxRow> = {}): FakeOutboxRow {
  return {
    id: BigInt(id),
    organizationId: 109,
    transactionId: BigInt(500 + id),
    event: 'charge.failed',
    payload: JSON.stringify({ transaction_id: String(500 + id), status: 'returned' }),
    dedupeKey: `charge.failed:${500 + id}`,
    status: 'pending',
    attempts: 0,
    nextAttemptAt: T0,
    lastError: null,
    deliveredAt: null,
    ...over,
  };
}

function harness(rows: FakeOutboxRow[], answers: boolean[], webhookUrl: string | null = 'https://receiver.example/hook') {
  const fake = createFakeAchDb({
    outbox: rows,
    orgs: [{ id: 109, webhookUrl, webhookSecret: 'whsec', fortisOnboarding: null }],
  });
  let now = T0;
  const sent: Array<{ url: string; event: string; data: Record<string, unknown> }> = [];
  const deps: OutboxDeps = {
    db: fake.db,
    now: () => now,
    async send(url, _secret, event, _org, data) {
      sent.push({ url, event, data });
      return answers[Math.min(sent.length - 1, answers.length - 1)];
    },
  };
  return { fake, deps, sent, at: (d: Date) => (now = d) };
}

test('delivered on the first try: marked delivered, with the stored payload and the CURRENT webhook URL', async () => {
  const h = harness([row(1)], [true]);
  assert.equal(await deliverOutboxEntry(h.deps, BigInt(1)), 'delivered');
  assert.deepEqual(h.sent, [{ url: 'https://receiver.example/hook', event: 'charge.failed', data: { transaction_id: '501', status: 'returned' } }]);
  const r = h.fake.outbox()[0];
  assert.equal(r.status, 'delivered');
  assert.equal(r.attempts, 1);
  assert.equal(r.deliveredAt?.getTime(), T0.getTime());
});

test('a failed delivery is retried with backoff until a 2xx', async () => {
  const h = harness([row(1)], [false, false, true]);
  assert.equal(await deliverOutboxEntry(h.deps, BigInt(1)), 'retry');
  let r = h.fake.outbox()[0];
  assert.equal(r.status, 'pending');
  assert.equal(r.attempts, 1);
  assert.equal(r.nextAttemptAt.getTime(), T0.getTime() + OUTBOX_BACKOFF_MS[0]);
  assert.match(r.lastError ?? '', /2xx/);

  // not due yet → not sent
  h.at(new Date(T0.getTime() + 4 * MIN));
  assert.deepEqual(await dueOutboxIds(h.fake.db, new Date(T0.getTime() + 4 * MIN), 10), []);
  assert.equal(await deliverOutboxEntry(h.deps, BigInt(1)), 'not_claimed');
  assert.equal(h.sent.length, 1);

  h.at(new Date(T0.getTime() + 5 * MIN));
  assert.deepEqual(await dueOutboxIds(h.fake.db, new Date(T0.getTime() + 5 * MIN), 10), [BigInt(1)]);
  assert.equal(await deliverOutboxEntry(h.deps, BigInt(1)), 'retry');
  r = h.fake.outbox()[0];
  assert.equal(r.attempts, 2);
  assert.equal(r.nextAttemptAt.getTime(), T0.getTime() + 5 * MIN + OUTBOX_BACKOFF_MS[1]);

  h.at(new Date(T0.getTime() + 5 * MIN + OUTBOX_BACKOFF_MS[1]));
  assert.equal(await deliverOutboxEntry(h.deps, BigInt(1)), 'delivered');
  assert.equal(h.fake.outbox()[0].status, 'delivered');
  assert.equal(h.sent.length, 3);
});

test('bounded: after OUTBOX_MAX_ATTEMPTS failures the row is left failed for a human', async () => {
  const h = harness([row(1, { attempts: OUTBOX_MAX_ATTEMPTS - 1 })], [false]);
  assert.equal(await deliverOutboxEntry(h.deps, BigInt(1)), 'failed');
  const r = h.fake.outbox()[0];
  assert.equal(r.status, 'failed');
  assert.equal(r.attempts, OUTBOX_MAX_ATTEMPTS);
  assert.deepEqual(await dueOutboxIds(h.fake.db, new Date(T0.getTime() + 365 * 24 * 60 * MIN), 10), []);
});

test('a merchant with no webhook URL any more: failed, nothing sent', async () => {
  const h = harness([row(1)], [true], null);
  assert.equal(await deliverOutboxEntry(h.deps, BigInt(1)), 'failed');
  assert.equal(h.sent.length, 0);
  assert.match(h.fake.outbox()[0].lastError ?? '', /No webhook URL/);
});

test('a claimed row cannot be sent twice at once (the lease), and a crashed sender is retried after it', async () => {
  const h = harness([row(1)], [true]);
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  const slowDeps: OutboxDeps = {
    ...h.deps,
    async send(...args) {
      await gate;
      return h.deps.send(...args);
    },
  };
  const first = deliverOutboxEntry(slowDeps, BigInt(1));
  await new Promise((r) => setImmediate(r));
  assert.equal(await deliverOutboxEntry(h.deps, BigInt(1)), 'not_claimed'); // held by the first sender
  release();
  assert.equal(await first, 'delivered');
  assert.equal(h.sent.length, 1);

  // a sender that died after claiming: the lease lapses and the row is due again
  const crashed = harness([row(2, { nextAttemptAt: new Date(T0.getTime() + OUTBOX_LEASE_MS) })], [true]);
  assert.deepEqual(await dueOutboxIds(crashed.fake.db, T0, 10), []);
  assert.deepEqual(await dueOutboxIds(crashed.fake.db, new Date(T0.getTime() + OUTBOX_LEASE_MS), 10), [BigInt(2)]);
});

test('superseded and delivered rows are never sent; due rows come oldest first', async () => {
  const h = harness(
    [
      row(1, { status: 'superseded' }),
      row(2, { status: 'delivered' }),
      row(3, { nextAttemptAt: new Date(T0.getTime() - 2 * MIN) }),
      row(4, { nextAttemptAt: new Date(T0.getTime() - 9 * MIN) }),
    ],
    [true],
  );
  assert.deepEqual(await dueOutboxIds(h.fake.db, T0, 10), [BigInt(4), BigInt(3)]);
  assert.deepEqual(await deliverOutboxEntries(h.deps, [BigInt(1), BigInt(2), BigInt(4), BigInt(3)]), ['not_claimed', 'not_claimed', 'delivered', 'delivered']);
  assert.equal(h.sent.length, 2);
});

test('a throwing sender counts as a failed attempt, never an exception', async () => {
  const h = harness([row(1)], [true]);
  h.deps.send = async () => {
    throw new Error('socket hang up');
  };
  assert.equal(await deliverOutboxEntry(h.deps, BigInt(1)), 'retry');
  assert.equal(h.fake.outbox()[0].lastError, 'socket hang up');
});
