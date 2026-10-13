/**
 * Durable delivery for merchant webhooks that must not be lost.
 *
 * deliverWebhook (lib/webhook.ts) tries three times within a few seconds and
 * then gives up for good. That is fine for events the merchant can re-read on
 * demand, but an ACH return can arrive weeks after the charge, and a lost
 * charge.failed is never re-sent. So those events go through an outbox:
 *
 *   1. the row is written in the SAME database transaction as the state change
 *      it announces (lib/fortis/ach-settlement.ts commitAchTransition), so a
 *      committed transition always has its announcement queued;
 *   2. it is delivered straight after commit, and if that fails, re-sent by
 *      the ACH reconcile cron with backoff — 5m, 15m, 1h, 3h, 6h, 12h, 24h —
 *      until the receiver returns a 2xx, at most OUTBOX_MAX_ATTEMPTS times
 *      (~2 days), then left as 'failed' for a human;
 *   3. each attempt claims the row first (a conditional write that moves
 *      next_attempt_at out by a lease), so two callers never send it at once,
 *      and a sender that dies mid-delivery is retried once the lease lapses.
 *
 * Delivery is at-least-once: a receiver that acked but whose ack was lost sees
 * the event again. Receivers dedupe on event + transaction_id (Aligned does);
 * every attempt goes through the normal signed sender and is logged in
 * webhook_deliveries.
 */

import type { PrismaClient } from '@prisma/client';

export const OUTBOX_MAX_ATTEMPTS = 8;
/** Wait after the Nth failed attempt (index N-1). */
export const OUTBOX_BACKOFF_MS = [
  5 * 60_000,
  15 * 60_000,
  60 * 60_000,
  3 * 60 * 60_000,
  6 * 60 * 60_000,
  12 * 60 * 60_000,
  24 * 60 * 60_000,
] as const;
/** How long a claimed row is reserved for its sender. */
export const OUTBOX_LEASE_MS = 10 * 60_000;

export type OutboxDb = Pick<PrismaClient, 'webhookOutbox' | 'organization'>;

export type OutboxEvent = 'charge.succeeded' | 'charge.failed' | 'subscription.cancelled';

export interface OutboxEntryInput {
  organizationId: number;
  transactionId: bigint | null;
  event: OutboxEvent;
  data: Record<string, unknown>;
  /** One row per announced transition, e.g. `charge.failed:<transaction id>`. */
  dedupeKey: string;
}

export interface OutboxDeps {
  db: OutboxDb;
  /** Signed delivery with its own short retry (lib/webhook.ts deliverWebhook). */
  send(
    webhookUrl: string,
    webhookSecret: string | null,
    event: OutboxEvent,
    organizationId: number,
    data: Record<string, unknown>
  ): Promise<boolean>;
  now?: () => Date;
}

export type OutboxDeliveryResult = 'delivered' | 'retry' | 'failed' | 'not_claimed';

function safeStringify(value: unknown): string {
  return JSON.stringify(value, (_key, v) => (typeof v === 'bigint' ? v.toString() : v));
}

/** Rows for createManyAndReturn — call inside the transaction that commits the change. */
export function outboxRows(entries: OutboxEntryInput[], now: Date) {
  return entries.map((e) => ({
    organizationId: e.organizationId,
    transactionId: e.transactionId,
    event: e.event,
    payload: safeStringify(e.data),
    dedupeKey: e.dedupeKey.slice(0, 128),
    status: 'pending',
    attempts: 0,
    nextAttemptAt: now,
  }));
}

function clock(deps: OutboxDeps): Date {
  return deps.now ? deps.now() : new Date();
}

/**
 * Claim one due row and deliver it to the organization's CURRENT webhook URL
 * and secret. Never throws for delivery trouble.
 */
export async function deliverOutboxEntry(deps: OutboxDeps, id: bigint): Promise<OutboxDeliveryResult> {
  const start = clock(deps);
  const claimed = await deps.db.webhookOutbox.updateMany({
    where: { id, status: 'pending', nextAttemptAt: { lte: start } },
    data: { nextAttemptAt: new Date(start.getTime() + OUTBOX_LEASE_MS) },
  });
  if (claimed.count !== 1) return 'not_claimed';

  const row = await deps.db.webhookOutbox.findUnique({ where: { id } });
  if (!row) return 'not_claimed';
  const attempts = row.attempts + 1;

  const org = await deps.db.organization.findUnique({
    where: { id: row.organizationId },
    select: { webhookUrl: true, webhookSecret: true },
  });

  let delivered = false;
  let lastError: string | null = null;
  if (!org?.webhookUrl) {
    lastError = 'No webhook URL configured for this merchant';
  } else {
    try {
      delivered = await deps.send(
        org.webhookUrl,
        org.webhookSecret,
        row.event as OutboxEvent,
        row.organizationId,
        JSON.parse(row.payload) as Record<string, unknown>
      );
      if (!delivered) lastError = 'Receiver did not return a 2xx (see webhook_deliveries)';
    } catch (err) {
      lastError = String((err as Error)?.message ?? err).slice(0, 2000);
    }
  }

  const done = clock(deps);
  if (delivered) {
    await deps.db.webhookOutbox.updateMany({
      where: { id },
      data: { status: 'delivered', attempts, deliveredAt: done, lastError: null },
    });
    return 'delivered';
  }
  if (!org?.webhookUrl || attempts >= OUTBOX_MAX_ATTEMPTS) {
    await deps.db.webhookOutbox.updateMany({
      where: { id, status: 'pending' },
      data: { status: 'failed', attempts, lastError },
    });
    return 'failed';
  }
  const wait = OUTBOX_BACKOFF_MS[Math.min(attempts - 1, OUTBOX_BACKOFF_MS.length - 1)];
  await deps.db.webhookOutbox.updateMany({
    where: { id, status: 'pending' },
    data: { attempts, nextAttemptAt: new Date(done.getTime() + wait), lastError },
  });
  return 'retry';
}

/** Rows whose next attempt is due, oldest first. */
export async function dueOutboxIds(db: OutboxDb, now: Date, limit: number): Promise<bigint[]> {
  const rows = await db.webhookOutbox.findMany({
    where: { status: 'pending', nextAttemptAt: { lte: now } },
    orderBy: { nextAttemptAt: 'asc' },
    take: limit,
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

/** Deliver several rows one after another (each claims itself first). */
export async function deliverOutboxEntries(deps: OutboxDeps, ids: bigint[]): Promise<OutboxDeliveryResult[]> {
  const results: OutboxDeliveryResult[] = [];
  for (const id of ids) {
    try {
      results.push(await deliverOutboxEntry(deps, id));
    } catch (err) {
      console.error(`[Webhook Outbox] Entry ${id} could not be processed:`, err);
      results.push('retry');
    }
  }
  return results;
}
