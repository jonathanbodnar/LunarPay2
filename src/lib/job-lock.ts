/**
 * Run leases for scheduled jobs (table job_locks).
 *
 * A job that more than one scheduler can trigger — Supabase pg_cron plus the
 * Railway cron backstop, or a manual curl — takes the lease before doing any
 * work and skips the run if someone else holds it. Taking it is a single
 * conditional write, so two runs can never both win; a run that crashes simply
 * lets its lease expire. Session advisory locks are not usable here: the app
 * reaches Postgres through Supabase's transaction pooler.
 */

import type { PrismaClient } from '@prisma/client';

export type JobLockDb = Pick<PrismaClient, 'jobLock'>;

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === 'P2002';
}

export async function acquireJobLock(
  db: JobLockDb,
  name: string,
  holder: string,
  ttlMs: number,
  now: Date = new Date()
): Promise<boolean> {
  const lockedUntil = new Date(now.getTime() + ttlMs);
  const taken = await db.jobLock.updateMany({
    where: { name, lockedUntil: { lt: now } },
    data: { lockedUntil, holder },
  });
  if (taken.count === 1) return true;
  try {
    await db.jobLock.create({ data: { name, lockedUntil, holder } });
    return true;
  } catch (err) {
    if (isUniqueViolation(err)) return false; // held by another run
    throw err;
  }
}

/** Free the lease (only if this run still holds it): the epoch is before any `now`. */
export async function releaseJobLock(db: JobLockDb, name: string, holder: string): Promise<void> {
  await db.jobLock.updateMany({ where: { name, holder }, data: { lockedUntil: new Date(0) } });
}
