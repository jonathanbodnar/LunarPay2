# LunarPay Cron Service

This is a lightweight container that runs on a schedule to process recurring subscriptions and send onboarding drip emails.

## Setup in Railway

1. **Create a new service** in Railway from this directory
2. **Set environment variables:**
   - `CRON_URL` = `https://app.lunarpay.com/api/cron/process-subscriptions?admin_key=${CRON_ADMIN_KEY}`
   - `ONBOARDING_EMAILS_URL` = `https://app.lunarpay.com/api/cron/onboarding-emails?admin_key=${CRON_ADMIN_KEY}`
   
   **Note:** `CRON_ADMIN_KEY` should be set as an environment variable in your Railway/Supabase deployment.

3. **Set Cron Schedule:** `0 * * * *` (runs every hour)

## What it does

### 1. Subscription Processing
- Processes all recurring subscriptions due for payment
- Charges customers automatically
- Sends payment receipts

### 2. Onboarding Email Drip Sequence
Sends a 4-part email series to users who haven't completed Fortis onboarding:
- **Email 1** (1 hour): Welcome + why we underwrite first
- **Email 2** (24 hours): Jonathan's Stripe shutdown story
- **Email 3** (72 hours): The explanation of how processors work
- **Email 4** (2 weeks): Re-engagement check-in

Emails stop automatically once the user completes onboarding (appStatus = ACTIVE).

## Schedule Examples

| Cron Expression | Description |
|-----------------|-------------|
| `0 * * * *` | Every hour (recommended) |
| `0 6 * * *` | Daily at 6 AM UTC |
| `0 */6 * * *` | Every 6 hours |

## Testing Locally

```bash
export CRON_URL="https://app.lunarpay.com/api/cron/process-subscriptions?admin_key=YOUR_KEY"
export ONBOARDING_EMAILS_URL="https://app.lunarpay.com/api/cron/onboarding-emails?admin_key=YOUR_KEY"
./run.sh
```

## Manual Trigger

You can manually trigger either endpoint:

```bash
# Process subscriptions
curl "https://app.lunarpay.com/api/cron/process-subscriptions?admin_key=${CRON_ADMIN_KEY}"

# Process onboarding emails
curl "https://app.lunarpay.com/api/cron/onboarding-emails?admin_key=${CRON_ADMIN_KEY}"
```

**Security Note:** Never commit actual admin keys to version control. Use environment variables.
