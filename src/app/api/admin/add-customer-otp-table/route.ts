import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/admin/add-customer-otp-table - Create customer_otp table
export async function POST() {
  try {
    // Create customer_otp table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS customer_otp (
        id SERIAL PRIMARY KEY,
        email VARCHAR(254) NOT NULL,
        organization_id INTEGER NOT NULL,
        code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create index
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_customer_otp_email_org 
      ON customer_otp(email, organization_id)
    `;

    return NextResponse.json({ 
      success: true, 
      message: 'Customer OTP table created successfully' 
    });
  } catch (error) {
    console.error('Create Customer OTP table error:', error);
    return NextResponse.json(
      { error: 'Failed to create table', details: String(error) },
      { status: 500 }
    );
  }
}

