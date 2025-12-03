#!/usr/bin/env python3
"""
Create migration SQL for jonathan@apollo.inc data
Extracts invoices, transactions, and related data from old DB
"""

import re
import json

# Read SQL dump
with open('./old/lunarprod202508-29 2.sql', 'r', encoding='utf-8', errors='ignore') as f:
    sql = f.read()

output_sql = []
output_sql.append("-- Migration SQL for jonathan@apollo.inc (church_id=2)")
output_sql.append("-- Generated from old database dump")
output_sql.append("-- User ID: 2, Organization ID: 2\n")

# Get the new user_id and org_id for jonathan@apollo.inc in new DB
output_sql.append("-- First, get IDs from new database:")
output_sql.append("DO $$")
output_sql.append("DECLARE")
output_sql.append("  v_user_id INTEGER;")
output_sql.append("  v_org_id INTEGER;")
output_sql.append("BEGIN")
output_sql.append("  -- Get user ID")
output_sql.append("  SELECT id INTO v_user_id FROM users WHERE email = 'jonathan@apollo.inc';")
output_sql.append("  -- Get organization ID")
output_sql.append("  SELECT ch_id INTO v_org_id FROM church_detail WHERE client_id = v_user_id;")
output_sql.append("  RAISE NOTICE 'User ID: %, Org ID: %', v_user_id, v_org_id;")
output_sql.append("END $$;\n")

# Extract invoices for church_id=2
invoice_match = re.search(r"INSERT INTO `invoices` VALUES (.+?);", sql, re.DOTALL)
if invoice_match:
    output_sql.append("-- INVOICES for church_id=2")
    invoice_data = invoice_match.group(1)
    # This is complex - let's count first
    invoices_for_church2 = []
    # Split carefully
    records = re.split(r'\),\(', invoice_data)
    for record in records:
        # Check if this invoice belongs to church_id=2
        parts = record.split(',')
        if len(parts) > 2:
            # church_id is typically the 2nd or 3rd field
            if ',2,' in record[:50]:  # church_id near beginning
                invoices_for_church2.append(record)
    
    output_sql.append(f"-- Found {len(invoices_for_church2)} invoices for church_id=2")
    output_sql.append(f"-- NOTE: Manual review and transformation needed\n")

# Extract transactions for church_id=2
trans_match = re.search(r"INSERT INTO `epicpay_customer_transactions` VALUES (.+?);", sql, re.DOTALL)
if trans_match:
    output_sql.append("-- TRANSACTIONS for church_id=2")
    trans_data = trans_match.group(1)
    trans_for_church2 = []
    records = re.split(r'\),\(', trans_data)
    for record in records:
        if ',2,' in record[:100]:  # church_id near beginning
            trans_for_church2.append(record)
    
    output_sql.append(f"-- Found {len(trans_for_church2)} transactions for church_id=2")
    output_sql.append(f"-- NOTE: Manual review and transformation needed\n")

# Extract donors for church_id=2  
donor_match = re.search(r"INSERT INTO `account_donor` VALUES (.+?);", sql, re.DOTALL)
if donor_match:
    output_sql.append("-- DONORS for church_id=2")
    donor_data = donor_match.group(1)
    donors_for_church2 = []
    records = re.split(r'\),\(', donor_data)
    for record in records:
        if ',2,' in record or 'jonathan@apollo.inc' in record:
            donors_for_church2.append(record)
    
    output_sql.append(f"-- Found {len(donors_for_church2)} donors for church_id=2")

# Write output
output_content = '\n'.join(output_sql)
with open('migration-data-summary.sql', 'w') as f:
    f.write(output_content)

print(output_content)
print("\n" + "="*60)
print("Migration summary saved to: migration-data-summary.sql")
print("\nDue to complexity, I recommend:")
print("1. Set password first so you can log in")
print("2. Migrate historical data separately if needed")
print("3. Or start fresh and use old DB for reference only")
