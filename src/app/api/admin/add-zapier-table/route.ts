import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/admin/add-zapier-table - Create zapier_webhooks table
export async function POST() {
  try {
    // Create zapier_webhooks table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS zapier_webhooks (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL,
        trigger_type VARCHAR(50) NOT NULL,
        webhook_url TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(organization_id, trigger_type, webhook_url)
      )
    `;

    // Create indexes
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_zapier_webhooks_org_trigger 
      ON zapier_webhooks(organization_id, trigger_type)
    `;

    return NextResponse.json({ 
      success: true, 
      message: 'Zapier webhooks table created successfully' 
    });
  } catch (error) {
    console.error('Create Zapier table error:', error);
    return NextResponse.json(
      { error: 'Failed to create table', details: String(error) },
      { status: 500 }
    );
  }
}

