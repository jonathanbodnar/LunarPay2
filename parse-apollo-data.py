#!/usr/bin/env python3
"""Parse Apollo Eleven Inc data from old SQL dump"""
import re

with open('./old/lunarprod202508-29 2.sql', 'r', encoding='utf-8', errors='ignore') as f:
    sql = f.read()

print("=== EXTRACTING DONORS for church_id=2 ===\n")

# Extract donors
donor_match = re.search(r"INSERT INTO `account_donor` VALUES (.+?);", sql, re.DOTALL)
if donor_match:
    donor_data = donor_match[1]
    records = re.split(r'\),\(', donor_data)
    
    donors_for_apollo = []
    for record in records:
        # Parse to check church_id
        parts = record.split("','")
        # The record format: (id,email,...,id_church,...)
        if ',2,' in record[:200] or 'jonathan@apollo.inc' in record:
            # Extract key fields
            id_match = re.match(r'^(\d+),', record)
            if id_match:
                donor_id = id_match.group(1)
                email_match = re.search(r"'([^']*@[^']*)'", record)
                email = email_match.group(1) if email_match else ''
                
                # Try to extract names (around positions 64-65 in the INSERT)
                name_match = re.search(r",'([^']*?)','([^']*?)',[\d\.]+,", record)
                first_name = name_match.group(1) if name_match else ''
                last_name = name_match.group(2) if name_match else ''
                
                donors_for_apollo.append({
                    'old_id': donor_id,
                    'email': email,
                    'first_name': first_name,
                    'last_name': last_name
                })
    
    print(f"Found {len(donors_for_apollo)} donors:")
    for d in donors_for_apollo[:10]:  # Show first 10
        print(f"  ID {d['old_id']}: {d['first_name']} {d['last_name']} <{d['email']}>")
    
    if len(donors_for_apollo) > 10:
        print(f"  ... and {len(donors_for_apollo) - 10} more")

