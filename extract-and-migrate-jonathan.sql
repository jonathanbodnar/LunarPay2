-- Migration script for jonathan@apollo.inc from old DB to new DB
-- User ID: 2, Organization ID: 2

-- First, let's update the existing jonathan@apollo.inc user with old data
-- Old user record: id=2, email='jonathan@apollo.inc', password='$2y$10$kAe39r54MTJDSmxfEkPINO9LhfitjBTF5ua7lnsAipzpX6VvJpWAG'

-- Update user with old password hash and details
UPDATE users 
SET 
  password = '$2y$10$kAe39r54MTJDSmxfEkPINO9LhfitjBTF5ua7lnsAipzpX6VvJpWAG',
  first_name = 'Jonathan',
  last_name = 'Bodnar',
  phone = '4699078539',
  role = 'admin',
  created_on = to_timestamp(1735248852),
  payment_processor = 'FTS'
WHERE email = 'jonathan@apollo.inc';

-- Get the user ID for jonathan@apollo.inc in new DB
-- Then update/create organization with old fortis token

-- Update organization for jonathan@apollo.inc  
UPDATE church_detail
SET 
  church_name = 'Apollo Eleven Inc',
  legal_name = 'Apollo Eleven Inc',
  street_address = '3316 taunton way',
  phone_no = '4699078539',
  slug = 'apollo-eleven-inc',
  fortis_template = 'lunarpayfr',
  created_at = '2024-12-26 15:34:12'
WHERE client_id = (SELECT id FROM users WHERE email = 'jonathan@apollo.inc');

-- Note: Need to manually extract Fortis IDs from fortis_onboarding table
-- Run this to see Fortis IDs:
SELECT * FROM church_detail WHERE ch_id = 2;

