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
```

**Security Note:** Never commit actual admin keys to version control. Use environment variables.
