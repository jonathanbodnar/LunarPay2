# LunarPay Subscription Cron Service

This is a lightweight container that runs on a schedule to process recurring subscriptions.

## Setup in Railway

1. **Create a new service** in Railway from this directory
2. **Set environment variable:**
   - `CRON_URL` = `https://app.lunarpay.com/api/cron/process-subscriptions?admin_key=Trump2028!%23%23!9`

3. **Set Cron Schedule:** `0 6 * * *` (runs daily at 6 AM UTC)

## How it works

- Railway starts this container at the scheduled time
- The container makes a single HTTP request to the subscription processing endpoint
- The endpoint processes all due subscriptions and charges customers
- The container logs the result and exits

## Schedule Examples

| Cron Expression | Description |
|-----------------|-------------|
| `0 6 * * *` | Daily at 6 AM UTC |
| `0 2 * * *` | Daily at 2 AM UTC |
| `0 12 * * *` | Daily at 12 PM UTC |
| `0 */6 * * *` | Every 6 hours |

## Testing Locally

```bash
export CRON_URL="https://app.lunarpay.com/api/cron/process-subscriptions?admin_key=YOUR_KEY"
./run.sh
```
