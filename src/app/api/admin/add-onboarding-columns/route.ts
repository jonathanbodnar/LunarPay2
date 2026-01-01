import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    // Add missing columns to church_onboard_fortis table
    const queries = [
      // Step tracking
      `ALTER TABLE church_onboard_fortis ADD COLUMN IF NOT EXISTS step_completed INTEGER DEFAULT 0`,
      
      // Step 1: Primary Principal Information
      `ALTER TABLE church_onboard_fortis ADD COLUMN IF NOT EXISTS sign_first_name VARCHAR(100)`,
      `ALTER TABLE church_onboard_fortis ADD COLUMN IF NOT EXISTS sign_last_name VARCHAR(100)`,
      `ALTER TABLE church_onboard_fortis ADD COLUMN IF NOT EXISTS sign_phone_number VARCHAR(50)`,
      `ALTER TABLE church_onboard_fortis ADD COLUMN IF NOT EXISTS email VARCHAR(255)`,
      
      // Step 1: Merchant Address
      `ALTER TABLE church_onboard_fortis ADD COLUMN IF NOT EXISTS merchant_address_line_1 VARCHAR(255)`,
      `ALTER TABLE church_onboard_fortis ADD COLUMN IF NOT EXISTS merchant_state VARCHAR(50)`,
      `ALTER TABLE church_onboard_fortis ADD COLUMN IF NOT EXISTS merchant_city VARCHAR(100)`,
      `ALTER TABLE church_onboard_fortis ADD COLUMN IF NOT EXISTS merchant_postal_code VARCHAR(20)`,
      
      // Step 2: Primary Bank Account (encrypted)
      `ALTER TABLE church_onboard_fortis ADD COLUMN IF NOT EXISTS ach_account_number VARCHAR(500)`,
      `ALTER TABLE church_onboard_fortis ADD COLUMN IF NOT EXISTS ach_routing_number VARCHAR(500)`,
      `ALTER TABLE church_onboard_fortis ADD COLUMN IF NOT EXISTS account_number_last4 VARCHAR(4)`,
      `ALTER TABLE church_onboard_fortis ADD COLUMN IF NOT EXISTS routing_number_last4 VARCHAR(4)`,
      `ALTER TABLE church_onboard_fortis ADD COLUMN IF NOT EXISTS account_holder_name VARCHAR(255)`,
      
      // Step 2: Alternative Bank Account (encrypted)
      `ALTER TABLE church_onboard_fortis ADD COLUMN IF NOT EXISTS ach_account_number2 VARCHAR(500)`,
      `ALTER TABLE church_onboard_fortis ADD COLUMN IF NOT EXISTS ach_routing_number2 VARCHAR(500)`,
      `ALTER TABLE church_onboard_fortis ADD COLUMN IF NOT EXISTS account2_number_last4 VARCHAR(4)`,
      `ALTER TABLE church_onboard_fortis ADD COLUMN IF NOT EXISTS routing2_number_last4 VARCHAR(4)`,
      `ALTER TABLE church_onboard_fortis ADD COLUMN IF NOT EXISTS account2_holder_name VARCHAR(255)`,
      
      // Fortis Application Status
      `ALTER TABLE church_onboard_fortis ADD COLUMN IF NOT EXISTS app_status VARCHAR(50)`,
      `ALTER TABLE church_onboard_fortis ADD COLUMN IF NOT EXISTS mpa_link TEXT`,
      
      // API Credentials
      `ALTER TABLE church_onboard_fortis ADD COLUMN IF NOT EXISTS location_id VARCHAR(255)`,
      `ALTER TABLE church_onboard_fortis ADD COLUMN IF NOT EXISTS product_transaction_id VARCHAR(255)`,
      `ALTER TABLE church_onboard_fortis ADD COLUMN IF NOT EXISTS auth_user_id VARCHAR(255)`,
      `ALTER TABLE church_onboard_fortis ADD COLUMN IF NOT EXISTS auth_user_api_key VARCHAR(255)`,
      
      // Audit
      `ALTER TABLE church_onboard_fortis ADD COLUMN IF NOT EXISTS processor_response TEXT`,
      `ALTER TABLE church_onboard_fortis ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()`,
      `ALTER TABLE church_onboard_fortis ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP`,
    ];

    const results = [];
    for (const query of queries) {
      try {
        await prisma.$executeRawUnsafe(query);
        results.push({ query: query.substring(0, 80) + '...', status: 'success' });
      } catch (e) {
        results.push({ query: query.substring(0, 80) + '...', status: 'error', error: (e as Error).message });
      }
    }

    return NextResponse.json({ 
      message: 'Onboarding columns migration completed',
      results 
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}

