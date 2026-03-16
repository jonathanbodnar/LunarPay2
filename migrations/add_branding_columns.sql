-- Migration: Add branding columns (primary_color, background_color, button_text_color) to church_detail table
-- Date: 2024-01-08
-- Description: Adds branding color columns to match Prisma schema and enable branding features

-- Add primary_color column if it doesn't exist
ALTER TABLE church_detail 
ADD COLUMN IF NOT EXISTS primary_color VARCHAR(20) DEFAULT '#000000';

-- Add background_color column if it doesn't exist
ALTER TABLE church_detail 
ADD COLUMN IF NOT EXISTS background_color VARCHAR(20) DEFAULT '#ffffff';

-- Add button_text_color column if it doesn't exist
ALTER TABLE church_detail 
ADD COLUMN IF NOT EXISTS button_text_color VARCHAR(20) DEFAULT '#ffffff';

-- Update existing records to have default values
UPDATE church_detail 
SET primary_color = '#000000' 
WHERE primary_color IS NULL;

UPDATE church_detail 
SET background_color = '#ffffff' 
WHERE background_color IS NULL;

UPDATE church_detail 
SET button_text_color = '#ffffff' 
WHERE button_text_color IS NULL;

-- Make columns NOT NULL (after setting defaults)
ALTER TABLE church_detail 
ALTER COLUMN primary_color SET NOT NULL,
ALTER COLUMN background_color SET NOT NULL,
ALTER COLUMN button_text_color SET NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN church_detail.primary_color IS 'Primary brand color for the organization (hex format)';
COMMENT ON COLUMN church_detail.background_color IS 'Background color for customer-facing pages (hex format)';
COMMENT ON COLUMN church_detail.button_text_color IS 'Text color for buttons (hex format)';

