-- 003 — Webhook observability
--
-- Context: merchant org 61's webhook URL + signing secret were reconfigured by
-- an integration on 2026-08-03 20:43:20 UTC. Deliveries kept firing; the
-- receiver rejected them on signature; postWithRetry treats 4xx as
-- non-retryable and dropped them. Nothing recorded it anywhere, so a ten-day
-- total outage was invisible from both sides.
--
-- Two gaps, two fixes:
--   1. webhook_deliveries already existed but was never written to. No DDL
--      needed beyond indexes for the queries we actually run.
--   2. Nothing recorded webhook_url / webhook_secret changes. New table below.
--
-- Additive only: no existing table is altered, no column is dropped or
-- retyped, no existing query plan changes. Safe to apply to a live database.

-- ── 1. Indexes for the delivery log ──────────────────────────────────────────
-- Created on an empty table, so these are instant and lock nothing meaningful.

CREATE INDEX IF NOT EXISTS webhook_deliveries_org_created_idx
  ON webhook_deliveries (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS webhook_deliveries_agency_created_idx
  ON webhook_deliveries (agency_id, created_at DESC);

-- The alerting query: "what has been failing, most recent first".
CREATE INDEX IF NOT EXISTS webhook_deliveries_status_created_idx
  ON webhook_deliveries (status, created_at DESC);

-- ── 2. Config-change audit ───────────────────────────────────────────────────
-- Answers "who repointed this endpoint, when, and from what" — the question
-- that took a forensic reconstruction from millisecond timestamps to answer.
--
-- Secrets are NEVER stored here. Only a last-4 hint, which is enough to tell
-- two secrets apart when reconciling against what a merchant has deployed
-- (exactly the check that identified this incident) and useless if leaked.

CREATE TABLE IF NOT EXISTS webhook_config_audit (
  id               BIGSERIAL PRIMARY KEY,

  -- 'organization' | 'agency'
  target           VARCHAR(20)  NOT NULL,
  organization_id  INTEGER,
  agency_id        INTEGER,

  -- 'set' | 'rotate' | 'delete' — 'rotate' means the signing secret changed,
  -- which is the transition that silently breaks a live receiver.
  action           VARCHAR(20)  NOT NULL,

  -- Which code path made the change, e.g. 'api_v1_webhook'.
  actor            VARCHAR(50)  NOT NULL,

  old_url          VARCHAR(500),
  new_url          VARCHAR(500),

  secret_changed   BOOLEAN      NOT NULL DEFAULT FALSE,
  old_secret_hint  VARCHAR(20),
  new_secret_hint  VARCHAR(20),

  created_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS webhook_config_audit_org_created_idx
  ON webhook_config_audit (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS webhook_config_audit_agency_created_idx
  ON webhook_config_audit (agency_id, created_at DESC);

-- ── 3. Backfill the one change we know about ─────────────────────────────────
-- Reconstructed, not observed — this predates the audit table. Recorded so the
-- history is not silently missing its most significant entry.
--   * 2026-08-03 20:43:20.464 — org 61 repointed to /api/giving/webhook and
--     secret rotated, by an Aligned giving sweep authenticating with org 61's
--     own merchant key (their ensureMerchantWebhook retried with
--     rotate_secret:true after reading an absent `secret` field as failure).
--   * 2026-08-13 — repointed to /api/billing/webhook with the secret the
--     merchant already held. Verified by signed test delivery, HTTP 200.

INSERT INTO webhook_config_audit
  (target, organization_id, action, actor, old_url, new_url,
   secret_changed, old_secret_hint, new_secret_hint, created_at)
SELECT
  'organization', 61, 'rotate', 'api_v1_webhook(reconstructed)',
  'https://aligned.church/api/billing/webhook',
  'https://aligned.church/api/giving/webhook',
  TRUE, NULL, '••••cbfd',
  '2026-08-03 20:43:20.464'
WHERE NOT EXISTS (
  SELECT 1 FROM webhook_config_audit WHERE organization_id = 61 AND actor LIKE '%reconstructed%'
);

INSERT INTO webhook_config_audit
  (target, organization_id, action, actor, old_url, new_url,
   secret_changed, old_secret_hint, new_secret_hint, created_at)
SELECT
  'organization', 61, 'set', 'incident-remediation(manual)',
  'https://aligned.church/api/giving/webhook',
  'https://aligned.church/api/billing/webhook',
  TRUE, '••••cbfd', '••••caa6',
  '2026-08-13 15:20:00'
WHERE NOT EXISTS (
  SELECT 1 FROM webhook_config_audit WHERE organization_id = 61 AND actor LIKE '%manual%'
);
