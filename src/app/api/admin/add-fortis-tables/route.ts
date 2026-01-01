import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Admin endpoint to ensure Fortis-related tables exist
 * POST /api/admin/add-fortis-tables
 */
export async function POST() {
  try {
    const results: string[] = [];

    // Create fortis_webhooks table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS fortis_webhooks (
        id BIGSERIAL PRIMARY KEY,
        event_json TEXT,
        system VARCHAR(50),
        mode VARCHAR(20),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    results.push('fortis_webhooks table ensured');

    // Ensure church_onboard_fortis table exists with all columns
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS church_onboard_fortis (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        church_id INTEGER UNIQUE NOT NULL,
        sign_first_name VARCHAR(100),
        sign_last_name VARCHAR(100),
        sign_phone_number VARCHAR(50),
        email VARCHAR(255),
        merchant_address_line_1 VARCHAR(255),
        merchant_state VARCHAR(50),
        merchant_city VARCHAR(100),
        merchant_postal_code VARCHAR(20),
        ach_account_number VARCHAR(500),
        ach_routing_number VARCHAR(500),
        account_number_last4 VARCHAR(4),
        routing_number_last4 VARCHAR(4),
        account_holder_name VARCHAR(255),
        ach_account_number2 VARCHAR(500),
        ach_routing_number2 VARCHAR(500),
        account2_number_last4 VARCHAR(4),
        routing2_number_last4 VARCHAR(4),
        account2_holder_name VARCHAR(255),
        step_completed INTEGER DEFAULT 0,
        app_status VARCHAR(50),
        mpa_link TEXT,
        location_id VARCHAR(255),
        product_transaction_id VARCHAR(255),
        auth_user_id VARCHAR(255),
        auth_user_api_key VARCHAR(255),
        processor_response TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE
      )
    `);
    results.push('church_onboard_fortis table ensured');

    // Add any missing columns to church_onboard_fortis if the table already exists
    const columns = [
      { name: 'sign_first_name', type: 'VARCHAR(100)' },
      { name: 'sign_last_name', type: 'VARCHAR(100)' },
      { name: 'sign_phone_number', type: 'VARCHAR(50)' },
      { name: 'email', type: 'VARCHAR(255)' },
      { name: 'merchant_address_line_1', type: 'VARCHAR(255)' },
      { name: 'merchant_state', type: 'VARCHAR(50)' },
      { name: 'merchant_city', type: 'VARCHAR(100)' },
      { name: 'merchant_postal_code', type: 'VARCHAR(20)' },
      { name: 'ach_account_number', type: 'VARCHAR(500)' },
      { name: 'ach_routing_number', type: 'VARCHAR(500)' },
      { name: 'account_number_last4', type: 'VARCHAR(4)' },
      { name: 'routing_number_last4', type: 'VARCHAR(4)' },
      { name: 'account_holder_name', type: 'VARCHAR(255)' },
      { name: 'ach_account_number2', type: 'VARCHAR(500)' },
      { name: 'ach_routing_number2', type: 'VARCHAR(500)' },
      { name: 'account2_number_last4', type: 'VARCHAR(4)' },
      { name: 'routing2_number_last4', type: 'VARCHAR(4)' },
      { name: 'account2_holder_name', type: 'VARCHAR(255)' },
      { name: 'step_completed', type: 'INTEGER DEFAULT 0' },
      { name: 'app_status', type: 'VARCHAR(50)' },
      { name: 'mpa_link', type: 'TEXT' },
      { name: 'location_id', type: 'VARCHAR(255)' },
      { name: 'product_transaction_id', type: 'VARCHAR(255)' },
      { name: 'auth_user_id', type: 'VARCHAR(255)' },
      { name: 'auth_user_api_key', type: 'VARCHAR(255)' },
      { name: 'processor_response', type: 'TEXT' },
    ];

    for (const col of columns) {
      try {
        await prisma.$executeRawUnsafe(
          `ALTER TABLE church_onboard_fortis ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`
        );
      } catch {
        // Column might already exist or have a different definition
      }
    }
    results.push('church_onboard_fortis columns verified');

    return NextResponse.json({ 
      message: 'Fortis tables migration completed',
      results 
    });
  } catch (error) {
    console.error('Error creating Fortis tables:', error);
    return NextResponse.json(
      { error: 'Failed to create Fortis tables', details: (error as Error).message },
      { status: 500 }
    );
  }
}

