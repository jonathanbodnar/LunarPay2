-- 005 — API key rotation without an outage
--
-- STATUS: APPLIED to production 2026-10-23, in one transaction with
-- lock_timeout 5s, BEFORE deploying the code that reads it.
--
-- Lets a merchant's replaced publishable/secret key keep authenticating while
-- the platform that holds it (RevOS, Aligned, StoryPay, ShoutOut) switches to
-- the new one. src/lib/api-auth.ts checks the current key first and falls back
-- to previous_publishable_key / previous_secret_key; a previous-key lookup
-- that fails (for example, before this file is applied) counts as "not found",
-- so this can be applied before or after the code that reads it.
--
-- Agency keys work the same way through agencies.previous_api_key
-- (requireAgencyKey).
--
-- Additive only: nullable columns and partial unique indexes on users (~250
-- rows) and agencies (2 rows); the index builds are sub-second, so no
-- CONCURRENTLY.
--
-- Rotate one merchant (new keys generated inside the database, so they never
-- pass through a terminal or chat; read them back in the SQL editor):
--
--   UPDATE users SET
--     previous_publishable_key = publishable_key,
--     previous_secret_key      = secret_key,
--     previous_key_last_used_at = NULL,
--     publishable_key = 'lp_pk_' || <48 random [A-Za-z0-9]>,
--     secret_key      = 'lp_sk_' || <48 random [A-Za-z0-9]>
--   WHERE id = <user id> AND previous_secret_key IS NULL;
--
-- Revoke the old keys once the platform has switched. previous_key_last_used_at
-- is stamped (at most once a minute) whenever an old key authenticates, so it
-- shows whether anything still uses them:
--
--   UPDATE users SET previous_publishable_key = NULL, previous_secret_key = NULL
--   WHERE id = <user id>;

ALTER TABLE "users"
    ADD COLUMN IF NOT EXISTS "previous_publishable_key" VARCHAR(255),
    ADD COLUMN IF NOT EXISTS "previous_secret_key" VARCHAR(255),
    ADD COLUMN IF NOT EXISTS "previous_key_last_used_at" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "users_previous_publishable_key_key"
    ON "users" ("previous_publishable_key") WHERE "previous_publishable_key" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "users_previous_secret_key_key"
    ON "users" ("previous_secret_key") WHERE "previous_secret_key" IS NOT NULL;

ALTER TABLE "agencies"
    ADD COLUMN IF NOT EXISTS "previous_api_key" VARCHAR(255),
    ADD COLUMN IF NOT EXISTS "previous_key_last_used_at" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "agencies_previous_api_key_key"
    ON "agencies" ("previous_api_key") WHERE "previous_api_key" IS NOT NULL;
