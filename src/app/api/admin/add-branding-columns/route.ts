import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ADMIN ENDPOINT - Add branding columns to organizations table
// This is a one-time migration endpoint
export async function POST() {
  try {
    // Add columns if they don't exist (PostgreSQL syntax)
    // Note: Organization model maps to "church_detail" table
    // Note: PaymentLink model maps to "payment_links" table
    const queries = [
      `ALTER TABLE church_detail ADD COLUMN IF NOT EXISTS primary_color VARCHAR(20) DEFAULT '#000000'`,
      `ALTER TABLE church_detail ADD COLUMN IF NOT EXISTS background_color VARCHAR(20) DEFAULT '#ffffff'`,
      `ALTER TABLE church_detail ADD COLUMN IF NOT EXISTS button_text_color VARCHAR(20) DEFAULT '#ffffff'`,
      `ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS webhook_url VARCHAR(500)`,
    ];

    const results = [];
    
    for (const query of queries) {
      try {
        await prisma.$executeRawUnsafe(query);
        results.push({ query, success: true });
      } catch (error) {
        results.push({ query, success: false, error: (error as Error).message });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Database migration completed',
      results,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', message: (error as Error).message },
      { status: 500 }
    );
  }
}

