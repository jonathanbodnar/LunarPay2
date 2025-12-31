import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Create the team_invites table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS team_invites (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL,
        invited_by INTEGER NOT NULL,
        email VARCHAR(254) NOT NULL,
        role VARCHAR(20) NOT NULL,
        permissions TEXT,
        token VARCHAR(255) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        expires_at TIMESTAMP NOT NULL,
        accepted_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create index for team_invites
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_team_invites_email_org 
      ON team_invites(email, organization_id)
    `;

    // Create the team_members table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS team_members (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        organization_id INTEGER NOT NULL,
        role VARCHAR(20) NOT NULL,
        permissions TEXT,
        invited_by INTEGER,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, organization_id)
      )
    `;

    return NextResponse.json({ 
      success: true, 
      message: 'Team tables created successfully' 
    });
  } catch (error) {
    console.error('Error creating team tables:', error);
    return NextResponse.json({ 
      error: 'Failed to create tables', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

