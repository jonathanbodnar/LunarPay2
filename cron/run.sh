#!/bin/sh

echo "=========================================="
echo "LunarPay Subscription Cron Job"
echo "Started at: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "=========================================="

# Call the subscription processing endpoint
response=$(curl -s -w "\n%{http_code}" "$CRON_URL")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo ""
echo "Response (HTTP $http_code):"
echo "$body" | head -c 2000

echo ""
echo "=========================================="
echo "Completed at: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "=========================================="
