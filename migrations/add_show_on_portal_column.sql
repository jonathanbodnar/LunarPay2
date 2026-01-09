-- Migration: Add show_on_portal column to products table
-- Date: 2024-01-08
-- Description: Adds the show_on_portal column to the products table to match Prisma schema

-- Add show_on_portal column if it doesn't exist
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS show_on_portal BOOLEAN DEFAULT false;

-- Update existing records to have default value
UPDATE products 
SET show_on_portal = false 
WHERE show_on_portal IS NULL;

-- Make the column NOT NULL (after setting defaults)
ALTER TABLE products 
ALTER COLUMN show_on_portal SET NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN products.show_on_portal IS 'Whether this product should be shown on the customer portal';

