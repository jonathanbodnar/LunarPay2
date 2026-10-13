import { test } from 'node:test';
import assert from 'node:assert/strict';
import { acquireJobLock, releaseJobLock } from '@/lib/job-lock';
import { createFakeAchDb } from './support/fake-ach-db';

const T0 = new Date('2026-10-20T00:00:00Z');
const at = (ms: number) => new Date(T0.getTime() + ms);

test('one holder at a time; released or expired leases can be taken again', async () => {
  const { db } = createFakeAchDb({});
  assert.equal(await acquireJobLock(db, 'reconcile-ach', 'run-a', 300_000, T0), true);
  assert.equal(await acquireJobLock(db, 'reconcile-ach', 'run-b', 300_000, at(1_000)), false);
  await releaseJobLock(db, 'reconcile-ach', 'run-a');
  assert.equal(await acquireJobLock(db, 'reconcile-ach', 'run-b', 300_000, at(2_000)), true); // free at once, same instant included
  // run-b crashes; its lease lapses after 5 minutes
  assert.equal(await acquireJobLock(db, 'reconcile-ach', 'run-c', 300_000, at(200_000)), false);
  assert.equal(await acquireJobLock(db, 'reconcile-ach', 'run-c', 300_000, at(304_000)), true);
});

test('a stale holder cannot release someone else’s lease', async () => {
  const { db } = createFakeAchDb({});
  await acquireJobLock(db, 'reconcile-ach', 'run-a', 300_000, T0);
  await releaseJobLock(db, 'reconcile-ach', 'run-z');
  assert.equal(await acquireJobLock(db, 'reconcile-ach', 'run-b', 300_000, at(2_000)), false);
});

test('two runs racing for a fresh lock: exactly one wins', async () => {
  const { db } = createFakeAchDb({});
  const results = await Promise.all([
    acquireJobLock(db, 'reconcile-ach', 'run-a', 300_000, T0),
    acquireJobLock(db, 'reconcile-ach', 'run-b', 300_000, T0),
  ]);
  assert.deepEqual(results.sort(), [false, true]);
});

test('locks are per job name', async () => {
  const { db } = createFakeAchDb({});
  assert.equal(await acquireJobLock(db, 'reconcile-ach', 'a', 300_000, T0), true);
  assert.equal(await acquireJobLock(db, 'some-other-job', 'b', 300_000, T0), true);
});
