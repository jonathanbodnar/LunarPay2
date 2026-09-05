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
- **Approval detection:** calls Fortis `GET /v1/users` and looks for the `api.<LegalName>@...` user Fortis provisions on approval. When found and no credentials are on file, the record moves to `APPROVED` and an alert is emailed to `ADMIN_EMAIL` so someone can finish activation manually. `APPROVED` does **not** enable payments; only `ACTIVE` (credentials on file) does.
- Status vocabulary: `PENDING` -> `BANK_INFORMATION_SENT` (MPA created, merchant must sign) -> `PENDING_REVIEW` (signed, Fortis underwriting) -> `APPROVED` (account provisioned, waiting on credentials webhook) -> `ACTIVE`. Also `DENIED` / `FORM_ERROR`.

Runs hourly here (Railway). A daily backstop at 06:30 UTC is also configured in `vercel.json` (Vercel Hobby plans reject anything more frequent).

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
```

**Security Note:** Never commit actual admin keys to version control. Use environment variables.
