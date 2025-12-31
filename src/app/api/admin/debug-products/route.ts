import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get all products with their portal status
    const products = await prisma.$queryRaw<Array<{
      id: number;
      name: string;
      organization_id: number;
      show_on_portal: boolean | null;
      trash: boolean;
    }>>`
      SELECT id, name, organization_id, show_on_portal, trash 
      FROM products 
      ORDER BY id DESC 
      LIMIT 20
    `;

    // Get organization portal settings
    const orgs = await prisma.$queryRaw<Array<{
      ch_id: number;
      church_name: string;
      portal_slug: string | null;
      portal_enabled: boolean | null;
    }>>`
      SELECT ch_id, church_name, portal_slug, portal_enabled 
      FROM church_detail 
      LIMIT 5
    `;

    return NextResponse.json({ 
      products,
      organizations: orgs,
      message: 'Debug info'
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: (error as Error).message 
    }, { status: 500 });
  }
}

