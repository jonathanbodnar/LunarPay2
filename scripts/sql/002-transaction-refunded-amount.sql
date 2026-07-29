-- STATUS: APPLIED to production 2026-07-29 as Supabase migration
--         `add_transaction_refunded_amount`. Kept here for the reasoning only —
--         do not re-run. Schema changes for this project go through Supabase
--         migrations (see `list_migrations`), not this directory.
--
-- Adds cumulative refund tracking to charges.
--
-- Why: a partial refund left no trace on the charge. Status stayed 'P' and
-- total_amount was unchanged, so POST /api/v1/charges/:id/refund could be
-- called again for the FULL amount on top of an existing partial — the only
-- record of the first one was the outbound payment.refunded webhook. This
-- column accumulates every refund and is checked against total_amount before
-- the next one is sent to Fortis.
--
-- Safe to run on a live database:
--   * NOT NULL with DEFAULT 0 — Postgres 11+ stores the default in the catalog
--     rather than rewriting the table, so this is a metadata-only change.
--   * The backfill below only touches rows already marked fully refunded.
--
-- Apply BEFORE deploying the code that writes the column.

ALTER TABLE epicpay_customer_transactions
  ADD COLUMN IF NOT EXISTS refunded_amount NUMERIC(10,2) NOT NULL DEFAULT 0;

-- Backfill history: rows sitting at status 'R' were fully refunded under the
-- old logic (it was the only way to reach 'R'), so their refunded total is the
-- charge total. Without this they would read as $0 refunded and remain fully
-- refundable a second time.
UPDATE epicpay_customer_transactions
   SET refunded_amount = total_amount
 WHERE status = 'R'
   AND refunded_amount = 0;

-- Historical PARTIAL refunds cannot be backfilled from this table — they were
-- never recorded here. If any exist, they are only visible in the delivered
-- payment.refunded webhooks or in Fortis's own reporting, and those charges
-- will read as $0 refunded. Reconcile against Fortis before relying on
-- refunded_amount for pre-migration rows.

-- Verify:
--   SELECT status, count(*), sum(refunded_amount)
--     FROM epicpay_customer_transactions GROUP BY status;
