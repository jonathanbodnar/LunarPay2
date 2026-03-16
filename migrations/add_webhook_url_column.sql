-- Migration: Add webhook_url column to payment_links table
-- Date: 2024-01-08
-- Description: Adds webhook_url column to match Prisma schema

-- Add webhook_url column if it doesn't exist
ALTER TABLE payment_links 
ADD COLUMN IF NOT EXISTS webhook_url VARCHAR(500);

-- Add comment for documentation
COMMENT ON COLUMN payment_links.webhook_url IS 'Webhook URL for payment link notifications';

