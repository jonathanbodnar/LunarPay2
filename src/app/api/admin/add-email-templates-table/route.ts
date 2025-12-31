import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Create the email_templates table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS email_templates (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL,
        template_type VARCHAR(50) NOT NULL,
        subject VARCHAR(255),
        heading VARCHAR(255),
        body_text TEXT,
        button_text VARCHAR(100),
        footer_text TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(organization_id, template_type)
      )
    `;

    // Create index for faster lookups
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_email_templates_org_type 
      ON email_templates(organization_id, template_type)
    `;

    return NextResponse.json({ 
      success: true, 
      message: 'Email templates table created successfully' 
    });
  } catch (error) {
    console.error('Error creating email templates table:', error);
    return NextResponse.json({ 
      error: 'Failed to create table', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

