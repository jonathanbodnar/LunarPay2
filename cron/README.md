# LunarPay Cron Service

Lightweight container that runs on a schedule to process subscriptions, installment plans, and send drip emails.

## Setup in Railway

1. **Create a new service** in Railway from this directory
2. **Set environment variables:**

| Variable | Value |
|---|---|
| `CRON_URL` | `https://app.lunarpay.com/api/cron/process-subscriptions?admin_key=YOUR_KEY` |
| `SCHEDULED_PAYMENTS_URL` | `https://app.lunarpay.com/api/cron/process-scheduled-payments?admin_key=YOUR_KEY` |
| `ONBOARDING_EMAILS_URL` | `https://app.lunarpay.com/api/cron/onboarding-emails?admin_key=YOUR_KEY` |
| `LEAD_NURTURING_URL` | `https://app.lunarpay.com/api/cron/lead-nurturing?admin_key=YOUR_KEY` |
| `CHAT_FOLLOWUP_URL` | `https://app.lunarpay.com/api/cron/chat-followup?admin_key=YOUR_KEY` |
| `ONBOARDING_STATUS_URL` | `https://app.lunarpay.com/api/cron/sync-onboarding-status?admin_key=YOUR_KEY` |
| `ACH_RECONCILE_URL` | `https://app.lunarpay.com/api/cron/reconcile-ach?admin_key=YOUR_KEY` |

3. **Set Cron Schedule:** `0 * * * *` (runs every hour)

## What it does

### 1. Subscription Processing (`CRON_URL`)
- Charges all recurring subscriptions due today
- Auto-cancels after 4 consecutive failures

### 2. Scheduled Payments / Installments (`SCHEDULED_PAYMENTS_URL`)
- Charges future installment payments whose `dueDate` is today or earlier
- Created automatically when a checkout session with `mode: "installments"` completes
- Marks the parent `PaymentSchedule` as `completed` once all payments are collected

### 3. Onboarding Email Drip (`ONBOARDING_EMAILS_URL`)
4-part series for users who haven't completed Fortis onboarding. Stops once `appStatus = ACTIVE`.

### 4. Lead Nurturing (`LEAD_NURTURING_URL`)
6-part series for leads who signed up but never registered.

### 5. Chat Followup (`CHAT_FOLLOWUP_URL`)
24h no-reply follow-up email.

### 6. Fortis onboarding status sync (`ONBOARDING_STATUS_URL`)
Reconciles every non-terminal `FortisOnboarding` record (`BANK_INFORMATION_SENT`, `PENDING_REVIEW`, `APPROVED`) with Fortis.

**Why this exists.** Fortis has no API to read a merchant application's status (`GET /v1/onboarding/{id}` returns "Route not found"), and the merchant's API credentials only ever arrive via the onboarding webhook (`/fortiswebhooks/merchant_account_status_listener`). If that webhook is missed, delayed, or fails to apply, the merchant sits in limbo with no automatic recovery. This job closes that gap:

- **Webhook replay:** re-applies stored webhook payloads that were received but never applied (e.g. the handler errored), moving the record to `ACTIVE` when credentials are present.
- **Approval detection:** calls Fortis `GET /v1/users` and looks for the `api.<LegalName>@...` user Fortis provisions on approval. When found and no credentials are on file, the record moves to `APPROVED` and an alert is emailed to `ADMIN_EMAIL`. `APPROVED` does **not** enable payments; only `ACTIVE` (credentials on file) does.
- **Self-provisioning (default on):** if the approval webhook still hasn't delivered credentials 10 minutes after Fortis created the merchant's `api.*` user, the reconciliation mints a new API key itself (`POST /v1/users/{id}/api-key`, office credentials), stores it immediately, reads the location's card/ACH products with the merchant's credentials, moves the record to `ACTIVE`, fires `merchant.approved` to the agency, and emails `ADMIN_EMAIL` that the Fortis postback for that agent is still missing. Any reconciliation path can do this (the 15-minute pg_cron job, the dashboard "Refresh Status", the agency sync endpoint, the public token endpoints); at most 3 merchants are provisioned per cron run. Concurrency rules: before minting, a run writes a claim token (`PROVISIONING:<ms>`) into `auth_user_api_key` with a conditional update, so only one run mints; a claim older than 5 minutes is taken over. A real key on file always wins over the key in a webhook (a stored key was minted after the webhook's key was issued, which invalidated it): the webhook handler and the stored-webhook replay keep the stored key and only take location/products, and while a claim is in flight the webhook handler records details but does not activate. No write ever lowers `ACTIVE` or `DENIED`. Set `ONBOARDING_AUTO_PROVISION=false` to stop minting once Fortis has registered the postback for every agent; a key already minted still finishes activation.
- Status vocabulary: `PENDING` -> `BANK_INFORMATION_SENT` (MPA created, merchant must sign) -> `PENDING_REVIEW` (signed, Fortis underwriting) -> `APPROVED` (account provisioned, waiting on credentials webhook) -> `ACTIVE`. Also `DENIED` / `FORM_ERROR`.

Runs every 15 minutes from the Supabase pg_cron job `sync-onboarding-status` (the scheduler of record); the Railway cron here is a redundant backstop.

Optional query params: `?organizationId=123` to sync a single org, `?limit=50` to cap the batch.

**Manual completion (webhook never arrived).** If a record is stuck in `APPROVED`, copy the API user's credentials from the Fortis portal and finish activation by hand:

```bash
# Auth: ?admin_key=$CRON_ADMIN_KEY (or -H "Authorization: Bearer $CRON_SECRET")
curl -X POST "https://app.lunarpay.com/api/admin/recover-status?admin_key=${CRON_ADMIN_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": 123,
    "authUserId": "<Fortis user id>",
    "authUserApiKey": "<Fortis user API key>",
    "locationId": "<optional>",
    "productTransactionId": "<optional CC product>",
    "achProductTransactionId": "<optional ACH product>"
  }'
```

Without `authUserId` + `authUserApiKey`, the same endpoint just runs a status sync for that organization.

Agencies can drive the same logic for their own merchants via `POST /api/v1/agency/merchants/:id/onboarding/submitted` (merchant has signed the MPA, moves `BANK_INFORMATION_SENT` -> `PENDING_REVIEW`) and `POST /api/v1/agency/merchants/:id/onboarding/sync` (reconcile with Fortis now).

### 7. ACH settlement reconcile (`ACH_RECONCILE_URL`)
An ACH debit is accepted by Fortis at once and clears — or comes back — days later. Fortis transaction postbacks are not registered for merchants, so without this job a bank-account charge stays pending forever. Each run (`src/app/api/cron/reconcile-ach` → `lib/fortis/ach-settlement.ts`):

- Takes a run lease (`job_locks`), so pg_cron and the Railway backstop can never run it concurrently; a second trigger during a run returns `ran: false` and reads nothing.
- Re-sends announcements that never got a 2xx (`webhook_outbox`, backoff 5m → 24h, at most 8 attempts). A row it gives up on is left `failed`, logged at error level (`[Webhook Outbox] GAVE UP …`) and emailed to `ADMIN_EMAIL` (or `ONBOARDING_ALERT_EMAIL`) — the same ops-alert channel as the onboarding reconciliation — with the SQL to re-queue it.
- Reads every waiting ACH debit (`src = 'BNK'`, status `U` or `P` with `status_ach` NULL / `W` / `pending`, at least 2 hours old, at most 90 days, not re-checked in the last ~2 hours) back from Fortis — `GET /v1/transactions/{id}` with **that merchant's own** credentials, in the environment `fortis_environment` selects (exactly as `POST /api/v1/charges` does) — then settled ones (`P`/`P`) about once a day for 75 days, to catch a late return. Imports (`fortis_import`, `stripe_import`) are never touched; rows whose id is not a Fortis id are rotated out of the queue.
- Maps Fortis's ACH lifecycle (`lib/fortis/ach-status.ts`): `131/132/133` still in flight → nothing; `134` settled → `status P`, `status_ach P`; `331` charged back, a return reason (`2101–2183` = R01–R83) or a real return date → `status N`, `status_ach F`; `201` voided → `status V`; `301` declined → `status N`.
- Moves the donor's running totals the way each charge path counted them, in the same database transaction as the status change.
- A returned **renewal** counts as a failed renewal (`fail_trxns`, `consecutive_failures`). The streak is read from the subscription's own recent charges, because the renewal cron resets its counter when the bank merely accepts a debit: declines and the return count; a renewal whose outcome is genuinely unknown (pending and newer than the return, or under 10 days old) is skipped; anything else — including an older renewal still recorded as pending, which cleared but was never reconciled — ends the streak. The subscription is cancelled at 4 consecutive failures, and at once on R02, R03, R04, R07, R08, R10, R16, R20 or R29 (no further debit allowed) — unless it has been charged successfully since the returned debit. No `payment.failed` is sent for a return.
- Known limit (left alone because fixing it means touching the card renewal path): `process-subscriptions` writes `consecutive_failures` from a read taken at the start of its loop, without a condition, so a decline it records can overwrite the count written here; and a subscription cancelled here between that cron's claim (`status = 'A'`) and its charge is still charged once. It never un-cancels: it only ever writes `status = 'D'`.
- Every change is a conditional write on the row's previous `(status, status_ach)`, so it lands — and is queued for announcement — exactly once, even with the Fortis transaction webhook (which uses the same code) racing it.
- Bounded: at most `limit` Fortis reads (default 100, max 500), 4 at a time, none started after 45 s.

**Who is told.** `charge.*` only for debits created through `POST /api/v1/charges` or a subscription renewal **at or after `ACH_CHARGE_EVENTS_SINCE`** — the merchant gets `charge.succeeded` (`status: 'paid'`) when the debit settles, or `charge.failed` (`status: 'returned' | 'voided' | 'failed'`, the reason in `error`, e.g. `ACH return R01: Insufficient funds`, and `return_code`). Everything else (older rows; hosted checkout, payment links, dashboard charges, installments) is reconciled **without** `charge.*`: those merchants never received it for those paths and do not start now; with the variable unset no `charge.*` is sent at all. **`subscription.cancelled`** is different: whenever a return cancels a subscription, every merchant with a webhook URL gets it, whatever the cutoff — the renewal cron already sends that event to them. Same sender, signing and payload keys as the charge route and the renewal cron.

Optional query params: `?organizationId=123` (one merchant), `?limit=50`, and **`?dryRun=1`** — reads Fortis and reports what would change: each transition lists the webhooks it would queue (`events`) and whether it would cancel a subscription (`subscriptionCancelled`). It writes nothing — not even the run lock — and sends nothing.

**Deploy setup — in this order:**

1. **Apply `scripts/sql/004-ach-settlement.sql`** to production (two new tables, `webhook_outbox` and `job_locks`, and one index). It is additive; nothing else reads them. Until it is applied the schema-drift check fails and this route returns 500 at its lock.
2. **Deploy** the code, with `ACH_CHARGE_EVENTS_SINCE` set on Railway to the deploy time as an ISO timestamp (e.g. `2026-10-15T00:00:00Z`).
3. **Review with a dry run** before anything is scheduled: `curl "https://app.lunarpay.com/api/cron/reconcile-ach?dryRun=1&limit=500&admin_key=${CRON_ADMIN_KEY}"`. It lists every status the first run would change (the backfill), shows that none of the older rows would send `charge.*`, and shows any subscription a return would cancel (with the `subscription.cancelled` it would send). Run it per merchant with `&organizationId=` if the list is long.
4. **Schedule** it in Supabase pg_cron (the scheduler of record) — same shape as the `sync-onboarding-status` job, with the same `CRON_SECRET` bearer:

   ```sql
   select cron.schedule(
     'reconcile-ach-hourly',
     '20 * * * *',
     $$
     SELECT net.http_post(
       url := 'https://app.lunarpay.com/api/cron/reconcile-ach',
       headers := jsonb_build_object(
         'Content-Type', 'application/json',
         'Authorization', 'Bearer <CRON_SECRET>'
       ),
       body := '{}'::jsonb,
       timeout_milliseconds := 60000
     ) as request_id;
     $$
   );
   ```
5. Optional backstop: set `ACH_RECONCILE_URL` on the Railway cron service. It cannot double the Fortis read rate: the lease prevents overlap, and rows checked in the last ~2 hours are skipped.

Stop it with `select cron.unschedule('reconcile-ach-hourly');`. Undelivered announcements: `select id, event, organization_id, attempts, last_error from webhook_outbox where status in ('pending','failed') order by created_at desc;`

**Fortis postbacks (optional).** If a transaction postback is ever registered for a merchant (`POST /v1/webhooks/transaction` with `on_update`, pointing at `/fortiswebhooks/merchant_account_status_listener`), ACH updates take effect within seconds instead of on the next run. Fortis posts these form-encoded; only a postback naming an ACH debit is acted on, and only as "check this transaction now" (at most once a minute per transaction) — the status is always re-read from Fortis. JSON webhooks, and form bodies that name anything else, are handled exactly as before.

> **Note:** Email categories `cron`, `subscription`, and `agency` are currently disabled via `EMAILS_DISABLED_CATEGORIES` while SendGrid is being resolved. Set `EMAILS_DISABLED_CATEGORIES=` (empty) on Railway to re-enable once fixed.

## Schedule Examples

| Cron Expression | Description |
|-----------------|-------------|
| `0 * * * *` | Every hour (recommended) |
| `0 6 * * *` | Daily at 6 AM UTC |
| `0 */6 * * *` | Every 6 hours |

## Testing Locally

```bash
export CRON_URL="https://app.lunarpay.com/api/cron/process-subscriptions?admin_key=YOUR_KEY"
export SCHEDULED_PAYMENTS_URL="https://app.lunarpay.com/api/cron/process-scheduled-payments?admin_key=YOUR_KEY"
export ONBOARDING_EMAILS_URL="https://app.lunarpay.com/api/cron/onboarding-emails?admin_key=YOUR_KEY"
./run.sh
```

## Manual Trigger

```bash
curl "https://app.lunarpay.com/api/cron/process-subscriptions?admin_key=${CRON_ADMIN_KEY}"
curl "https://app.lunarpay.com/api/cron/process-scheduled-payments?admin_key=${CRON_ADMIN_KEY}"
curl "https://app.lunarpay.com/api/cron/onboarding-emails?admin_key=${CRON_ADMIN_KEY}"
curl "https://app.lunarpay.com/api/cron/sync-onboarding-status?admin_key=${CRON_ADMIN_KEY}"
curl "https://app.lunarpay.com/api/cron/reconcile-ach?admin_key=${CRON_ADMIN_KEY}"
```

**Security Note:** Never commit actual admin keys to version control. Use environment variables.
