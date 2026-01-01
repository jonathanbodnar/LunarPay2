import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// TEMPORARY DEBUG ENDPOINT - DELETE AFTER USE
export async function GET() {
  try {
    const portals = await prisma.$queryRaw<Array<{
      church_detail_id: number;
      name: string;
      portal_slug: string | null;
      portal_enabled: boolean;
      portal_custom_domain: string | null;
    }>>`
      SELECT church_detail_id, name, portal_slug, portal_enabled, portal_custom_domain
      FROM church_detail
      WHERE portal_enabled = true OR portal_custom_domain IS NOT NULL
      ORDER BY church_detail_id
      LIMIT 20
    `;

    // Also check if SENDGRID_API_KEY is configured
    const sendgridConfigured = !!process.env.SENDGRID_API_KEY;

    return NextResponse.json({
      count: portals.length,
      portals,
      sendgridConfigured,
      sendgridFromEmail: process.env.SENDGRID_FROM_EMAIL || 'not set',
    });
  } catch (error) {
    console.error('Debug portals error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portals', details: String(error) },
      { status: 500 }
    );
  }
}

