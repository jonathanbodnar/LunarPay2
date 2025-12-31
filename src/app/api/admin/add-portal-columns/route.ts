import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/admin/add-portal-columns - Add customer portal columns to database
export async function POST() {
  try {
    // Add portal columns to church_detail (Organization)
    await prisma.$executeRaw`
      ALTER TABLE church_detail 
      ADD COLUMN IF NOT EXISTS portal_slug VARCHAR(100) UNIQUE,
      ADD COLUMN IF NOT EXISTS portal_enabled BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS portal_custom_domain VARCHAR(255),
      ADD COLUMN IF NOT EXISTS portal_title VARCHAR(255),
      ADD COLUMN IF NOT EXISTS portal_description TEXT
    `;

    // Add show_on_portal to products
    await prisma.$executeRaw`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS show_on_portal BOOLEAN DEFAULT false
    `;

    // Create customer_sessions table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS customer_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        donor_id INTEGER NOT NULL REFERENCES account_donor(id),
        organization_id INTEGER NOT NULL,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create customer_otp table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS customer_otp (
        id SERIAL PRIMARY KEY,
        email VARCHAR(254) NOT NULL,
        organization_id INTEGER NOT NULL,
        code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create index on customer_otp
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_customer_otp_email_org 
      ON customer_otp(email, organization_id)
    `;

    return NextResponse.json({
      success: true,
      message: 'Customer portal columns added successfully',
    });
  } catch (error) {
    console.error('Add portal columns error:', error);
    return NextResponse.json(
      { error: 'Failed to add portal columns', details: (error as Error).message },
      { status: 500 }
    );
  }
}

