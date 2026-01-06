import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// TEMPORARY DEBUG ENDPOINT - DELETE AFTER USE
export async function GET() {
  try {
    // Get recent sessions with details
    const recentSessions = await prisma.$queryRaw<Array<{
      id: string;
      donor_id: number;
      organization_id: number;
      expires_at: Date;
      created_at: Date;
    }>>`
      SELECT id, donor_id, organization_id, expires_at, created_at
      FROM customer_sessions
      ORDER BY created_at DESC
      LIMIT 5
    `;

    // Get products for org 1 with show_on_portal
    const products = await prisma.$queryRaw<Array<{
      id: number;
      name: string;
      church_id: number;
      show_on_portal: boolean;
      price: number;
    }>>`
      SELECT id, name, church_id, show_on_portal, price
      FROM products
      WHERE church_id = 1 AND show_on_portal = true AND (trash = false OR trash IS NULL)
      LIMIT 10
    `;

    return NextResponse.json({
      recentSessions: recentSessions.map(s => ({
        ...s,
        id: s.id.substring(0, 8) + '...',
      })),
      productsForOrg1: products,
      productCount: products.length,
    });
  } catch (error) {
    console.error('Debug sessions error:', error);
    return NextResponse.json(
      { error: 'Debug failed', details: String(error) },
      { status: 500 }
    );
  }
}

