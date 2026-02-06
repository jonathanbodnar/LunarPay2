#!/bin/sh

echo "=========================================="
echo "LunarPay Cron Jobs"
echo "Started at: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "=========================================="

# Job 1: Process Subscriptions
if [ -n "$CRON_URL" ]; then
  echo ""
  echo "--- Processing Subscriptions ---"
  response=$(curl -s -w "\n%{http_code}" "$CRON_URL")
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  echo "Response (HTTP $http_code):"
  echo "$body" | head -c 1000
fi

# Job 2: Process Onboarding Emails
if [ -n "$ONBOARDING_EMAILS_URL" ]; then
  echo ""
  echo "--- Processing Onboarding Emails ---"
  response=$(curl -s -w "\n%{http_code}" "$ONBOARDING_EMAILS_URL")
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  echo "Response (HTTP $http_code):"
  echo "$body" | head -c 1000
fi

echo ""
echo "=========================================="
echo "Completed at: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "=========================================="
