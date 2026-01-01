import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/admin/add-customer-sessions-table - Create customer sessions table
export async function POST() {
  try {
    // Create customer_sessions table if it doesn't exist
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS customer_sessions (
        id VARCHAR(36) PRIMARY KEY,
        donor_id INTEGER NOT NULL,
        organization_id INTEGER NOT NULL,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create customer_otps table if it doesn't exist
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS customer_otps (
        id SERIAL PRIMARY KEY,
        email VARCHAR(254) NOT NULL,
        organization_id INTEGER NOT NULL,
        code VARCHAR(10) NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_customer_sessions_token ON customer_sessions(token)
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_customer_sessions_donor ON customer_sessions(donor_id)
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_customer_otps_email_org ON customer_otps(email, organization_id)
    `;

    return NextResponse.json({ 
      success: true, 
      message: 'Customer sessions and OTP tables created/verified' 
    });
  } catch (error) {
    console.error('Create customer sessions table error:', error);
    return NextResponse.json(
      { error: 'Failed to create tables', details: String(error) },
      { status: 500 }
    );
  }
}

