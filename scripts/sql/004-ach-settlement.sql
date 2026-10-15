-- 004 — ACH settlement tracking (branch feat/ach-tracking)
--
-- STATUS: APPLIED to production 2026-10-15, in one transaction (index built
-- without CONCURRENTLY, lock_timeout 5s), together with section 4 below.
-- Applied BEFORE deploying the code that
-- uses it. Until it is applied, the schema-drift check fails (it will print
-- exactly this DDL), /api/cron/reconcile-ach returns 500 at its run lock, and
-- an ACH webhook re-read that needs to queue an announcement rolls back (the
-- debit stays pending for the next try). Only the ACH settlement code reads
-- or writes these objects; no card, onboarding or other path is affected.
--
-- Additive only: two new tables and one new index. No existing column is
-- added, altered or dropped. The DDL is what `prisma migrate diff` emits for
-- prisma/schema.prisma, with IF NOT EXISTS added and the index on the live
-- transactions table built CONCURRENTLY.
--
--   1. webhook_outbox — merchant webhooks that must not be lost. A row is
--      written in the same transaction as the ACH state change it announces
--      (charge.succeeded / charge.failed / subscription.cancelled) and is
--      re-sent by the reconcile cron, with backoff, until the receiver
--      returns a 2xx — at most 8 attempts over ~2 days (src/lib/webhook-outbox.ts).
--   2. job_locks — a run lease, so Supabase pg_cron and the Railway cron
--      backstop can never run the reconcile concurrently.
--   3. transactions_src_status_updated_idx — the reconcile's queue query is
--      `src = 'BNK' AND status IN ('U','P') ... ORDER BY updated_at LIMIT n`;
--      the index keeps it off a sequential scan as card volume grows.
--
-- Statements 1–2 may run in one transaction. Statement 3 uses CONCURRENTLY,
-- which cannot run inside a transaction block: run it on its own (with
-- Supabase `apply_migration`, which wraps a transaction, drop CONCURRENTLY —
-- the table is ~2.3k rows, so the build is sub-second either way).

-- ── 1. webhook_outbox ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "webhook_outbox" (
    "id" BIGSERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "transaction_id" BIGINT,
    "event" VARCHAR(64) NOT NULL,
    "payload" TEXT NOT NULL,
    "dedupe_key" VARCHAR(128) NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "next_attempt_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_error" TEXT,
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_outbox_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "webhook_outbox_dedupe_key_key" ON "webhook_outbox"("dedupe_key");
CREATE INDEX IF NOT EXISTS "webhook_outbox_due_idx" ON "webhook_outbox"("status", "next_attempt_at");
CREATE INDEX IF NOT EXISTS "webhook_outbox_transaction_idx" ON "webhook_outbox"("transaction_id");

-- ── 2. job_locks ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "job_locks" (
    "name" VARCHAR(64) NOT NULL,
    "locked_until" TIMESTAMP(3) NOT NULL,
    "holder" VARCHAR(64),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_locks_pkey" PRIMARY KEY ("name")
);

-- ── 3. The reconcile queue's index (run on its own) ──────────────────────────

CREATE INDEX CONCURRENTLY IF NOT EXISTS "transactions_src_status_updated_idx"
  ON "epicpay_customer_transactions"("src", "status", "updated_at");

-- ── 4. Keep both tables off the public Supabase API ─────────────────────────
-- Supabase's default privileges give anon/authenticated full rights on every
-- new table in public, and PostgREST serves public to the anon key. With RLS
-- off, anyone holding that key could insert an outbox row that LunarPay would
-- sign and deliver as a merchant webhook, or hold job_locks forever. This
-- matches the RLS-on posture of the other app tables; the app connects as the
-- table owner (postgres), which RLS does not restrict.

ALTER TABLE "webhook_outbox" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "job_locks" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "webhook_outbox", "job_locks" FROM anon, authenticated;
REVOKE ALL ON SEQUENCE "webhook_outbox_id_seq" FROM anon, authenticated;

-- Verify:
--   SELECT to_regclass('public.webhook_outbox'), to_regclass('public.job_locks'),
--          to_regclass('public.transactions_src_status_updated_idx');
--   npm run db:diff   -- should print an empty migration
--
-- Roll back (only before any row matters):
--   DROP INDEX CONCURRENTLY IF EXISTS "transactions_src_status_updated_idx";
--   DROP TABLE IF EXISTS "job_locks";
--   DROP TABLE IF EXISTS "webhook_outbox";
