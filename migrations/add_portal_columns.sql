-- Migration: Add portal-related columns to church_detail table
-- Date: 2024-01-08
-- Description: Adds customer portal settings columns to match Prisma schema

-- Add portal_slug column if it doesn't exist
ALTER TABLE church_detail 
ADD COLUMN IF NOT EXISTS portal_slug VARCHAR(100) UNIQUE;

-- Add portal_enabled column if it doesn't exist
ALTER TABLE church_detail 
ADD COLUMN IF NOT EXISTS portal_enabled BOOLEAN DEFAULT false;

-- Add portal_custom_domain column if it doesn't exist
ALTER TABLE church_detail 
ADD COLUMN IF NOT EXISTS portal_custom_domain VARCHAR(255);

-- Add portal_title column if it doesn't exist
ALTER TABLE church_detail 
ADD COLUMN IF NOT EXISTS portal_title VARCHAR(255);

-- Add portal_description column if it doesn't exist
ALTER TABLE church_detail 
ADD COLUMN IF NOT EXISTS portal_description TEXT;

-- Update existing records to have default values
UPDATE church_detail 
SET portal_enabled = false 
WHERE portal_enabled IS NULL;

-- Make portal_enabled NOT NULL (after setting defaults)
ALTER TABLE church_detail 
ALTER COLUMN portal_enabled SET NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN church_detail.portal_slug IS 'Unique slug for customer portal URL';
COMMENT ON COLUMN church_detail.portal_enabled IS 'Whether customer portal is enabled for this organization';
COMMENT ON COLUMN church_detail.portal_custom_domain IS 'Custom domain for customer portal';
COMMENT ON COLUMN church_detail.portal_title IS 'Title displayed on customer portal';
COMMENT ON COLUMN church_detail.portal_description IS 'Description text for customer portal';

