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
  const gaveUp: unknown[] = [];
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
    onGiveUp(entry) {
      gaveUp.push(entry);
    },
  };
  return { fake, deps, sent, gaveUp, at: (d: Date) => (now = d) };
}

/** Run fn with console.error captured. */
async function capturingErrors<T>(fn: () => Promise<T>): Promise<{ result: T; errors: string[] }> {
  const errors: string[] = [];
  const original = console.error;
  console.error = (...args: unknown[]) => {
    errors.push(args.map(String).join(' '));
  };
  try {
    return { result: await fn(), errors };
  } finally {
    console.error = original;
  }
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

test('bounded: after OUTBOX_MAX_ATTEMPTS failures the row is left failed — logged at error level and alerted once', async () => {
  const h = harness([row(1, { attempts: OUTBOX_MAX_ATTEMPTS - 1 })], [false]);
  const { result, errors } = await capturingErrors(() => deliverOutboxEntry(h.deps, BigInt(1)));
  assert.equal(result, 'failed');
  assert.equal(errors.length, 1);
  assert.match(errors[0], /GAVE UP on charge\.failed for organization 109 \(transaction 501\) after 8 attempt/);
  assert.deepEqual(h.gaveUp, [{
    id: BigInt(1), organizationId: 109, transactionId: BigInt(501), event: 'charge.failed',
    attempts: OUTBOX_MAX_ATTEMPTS, lastError: 'Receiver did not return a 2xx (see webhook_deliveries)',
  }]);
  // nothing further happens to a failed row, and it is never alerted again
  assert.equal(await deliverOutboxEntry(h.deps, BigInt(1)), 'not_claimed');
  assert.equal(h.gaveUp.length, 1);
  const r = h.fake.outbox()[0];
  assert.equal(r.status, 'failed');
  assert.equal(r.attempts, OUTBOX_MAX_ATTEMPTS);
  assert.deepEqual(await dueOutboxIds(h.fake.db, new Date(T0.getTime() + 365 * 24 * 60 * MIN), 10), []);
});

test('a merchant with no webhook URL any more: failed and alerted, nothing sent', async () => {
  const h = harness([row(1)], [true], null);
  const { result, errors } = await capturingErrors(() => deliverOutboxEntry(h.deps, BigInt(1)));
  assert.equal(result, 'failed');
  assert.equal(errors.length, 1);
  assert.equal(h.sent.length, 0);
  assert.equal(h.gaveUp.length, 1);
  assert.match(h.fake.outbox()[0].lastError ?? '', /No webhook URL/);
});

test('a retry is not a give-up: no alert, no error log from the outbox', async () => {
  const h = harness([row(1)], [false]);
  const { result, errors } = await capturingErrors(() => deliverOutboxEntry(h.deps, BigInt(1)));
  assert.equal(result, 'retry');
  assert.deepEqual(errors, []);
  assert.equal(h.gaveUp.length, 0);
});

test('a failing alert hook never breaks delivery bookkeeping', async () => {
  const h = harness([row(1, { attempts: OUTBOX_MAX_ATTEMPTS - 1 })], [false]);
  h.deps.onGiveUp = () => {
    throw new Error('sendgrid down');
  };
  const { result, errors } = await capturingErrors(() => deliverOutboxEntry(h.deps, BigInt(1)));
  assert.equal(result, 'failed');
  assert.equal(h.fake.outbox()[0].status, 'failed');
  assert.equal(errors.length, 2); // the give-up itself, then the alert failure
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
