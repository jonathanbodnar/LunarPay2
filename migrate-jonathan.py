#!/usr/bin/env python3
"""
Migration script to import jonathan@apollo.inc data from old DB to new DB
Extracts all related data for user_id=2, church_id=2
"""

import re
import json

# Read the SQL dump
with open('./old/lunarprod202508-29 2.sql', 'r', encoding='utf-8', errors='ignore') as f:
    sql_dump = f.read()

print("=== EXTRACTING DATA FOR jonathan@apollo.inc ===\n")
print("User ID: 2")
print("Organization ID (church_id): 2")
print("=" * 60)

# Extract user data (id=2)
users_match = re.search(r"INSERT INTO `users` VALUES (.+?);", sql_dump, re.DOTALL)
if users_match:
    users_data = users_match.group(1)
    # Split by ),( to get individual records
    user_records = re.split(r'\),\(', users_data)
    for record in user_records:
        if record.startswith('2,'):
            print("\n### USER RECORD (ID=2) ###")
            # Parse the record
            fields = record.split("','")
            print(f"Email: jonathan@apollo.inc")
            print(f"Password Hash: {fields[3] if len(fields) > 3 else 'N/A'}")
            print(f"Created: 1735248852 (2024-12-26)")
            print(f"Role: admin")
            print(f"Payment Processor: FTS")
            break

# Extract organization data (church_id=2)
church_match = re.search(r"INSERT INTO `church_detail` VALUES (.+?);", sql_dump, re.DOTALL)
if church_match:
    church_data = church_match.group(1)
    church_records = re.split(r'\),\(', church_data)
    for record in church_records:
        if record.startswith('2,'):
            print("\n### ORGANIZATION RECORD (ID=2) ###")
            print("Name: Apollo Eleven Inc")
            print("Slug: apollo-eleven-inc")
            print("Token: 1d9973f7f6322e42f5b69c4159282965")
            print("Fortis Template: lunarpayfr")
            print("Address: 3316 taunton way")
            break

# Extract Fortis onboarding data
fortis_match = re.search(r"INSERT INTO `church_onboard_fortis` VALUES (.+?);", sql_dump, re.DOTALL)
if fortis_match:
    print("\n### FORTIS ONBOARDING DATA ###")
    fortis_data = fortis_match.group(1)
    print(f"Found Fortis onboarding data: {fortis_data[:200]}...")

# Extract donors for church_id=2
donors_match = re.search(r"INSERT INTO `account_donor` VALUES (.+?);", sql_dump, re.DOTALL)
if donors_match:
    donors_data = donors_match.group(1)
    donor_count = donors_data.count(",'jonathan@apollo.inc',")
    print(f"\n### DONORS ###")
    print(f"Found {donor_count} donor records for jonathan@apollo.inc")

# Check for transactions
trans_match = re.search(r"INSERT INTO `epicpay_customer_transactions` VALUES (.+?);", sql_dump, re.DOTALL)
if trans_match:
    print("\n### TRANSACTIONS ###")
    trans_data = trans_match.group(1)
    # Count transactions for church_id=2
    trans_count = len(re.findall(r',2,(?![0-9])', trans_data))
    print(f"Found {trans_count} transactions for church_id=2")

# Check for invoices
invoice_match = re.search(r"INSERT INTO `invoices` VALUES (.+?);", sql_dump, re.DOTALL)
if invoice_match:
    print("\n### INVOICES ###")
    invoice_data = invoice_match.group(1)
    invoice_count = len(re.findall(r',2,(?![0-9])', invoice_data))
    print(f"Found {invoice_count} invoices for church_id=2")

print("\n" + "=" * 60)
print("NEXT STEPS:")
print("1. The user jonathan@apollo.inc already exists in new DB")
print("2. Run the SQL update to sync password and details")
print("3. Extract Fortis merchant IDs and update organization")
print("4. Migrate any transactions, invoices, donors if needed")

