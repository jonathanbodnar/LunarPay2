-- Migration SQL for jonathan@apollo.inc (church_id=2)
-- Generated from old database dump
-- User ID: 2, Organization ID: 2

-- First, get IDs from new database:
DO $$
DECLARE
  v_user_id INTEGER;
  v_org_id INTEGER;
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id FROM users WHERE email = 'jonathan@apollo.inc';
  -- Get organization ID
  SELECT ch_id INTO v_org_id FROM church_detail WHERE client_id = v_user_id;
  RAISE NOTICE 'User ID: %, Org ID: %', v_user_id, v_org_id;
END $$;

-- INVOICES for church_id=2
-- Found 27 invoices for church_id=2
-- NOTE: Manual review and transformation needed

-- TRANSACTIONS for church_id=2
-- Found 17 transactions for church_id=2
-- NOTE: Manual review and transformation needed

-- DONORS for church_id=2
-- Found 35 donors for church_id=2

============================================================
Migration summary saved to: migration-data-summary.sql

Due to complexity, I recommend:
1. Set password first so you can log in
2. Migrate historical data separately if needed
3. Or start fresh and use old DB for reference only
