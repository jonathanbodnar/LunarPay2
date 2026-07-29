-- STATUS: APPLIED to production 2026-07-29 as Supabase migration
--         `add_transaction_idempotency_key`. Kept here for the reasoning only —
--         do not re-run. The index was created WITHOUT `CONCURRENTLY`, since
--         `apply_migration` runs inside a transaction block and the table is
--         only ~1.1k rows, so the build is sub-second.
--
-- Adds the replay guard for POST /api/v1/charges.
--
-- Why: charges carried no idempotency key, so a re-submitted checkout or a
-- client retry after a timeout took the money a second time. With this column
-- a repeated request carrying a key we've already charged returns the original
-- transaction instead.
--
-- Safe to run on a live database:
--   * The column is nullable, so every existing row stays valid.
--   * Postgres treats NULLs as distinct, so the unique index does not collide
--     across the ~thousands of historical rows that have no key.
--   * CONCURRENTLY avoids taking a write lock on epicpay_customer_transactions.
--
-- Apply BEFORE deploying the code that writes the column.
-- CREATE INDEX CONCURRENTLY cannot run inside a transaction block — run these
-- as separate statements, not wrapped in BEGIN/COMMIT.

ALTER TABLE epicpay_customer_transactions
  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(64);

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS transaction_org_idempotency_key
  ON epicpay_customer_transactions (church_id, idempotency_key);

-- Verify:
--   SELECT indexname FROM pg_indexes
--    WHERE tablename = 'epicpay_customer_transactions'
--      AND indexname = 'transaction_org_idempotency_key';
