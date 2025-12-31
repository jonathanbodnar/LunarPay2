import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { slug, orgName } = await request.json();
    
    // Update organization to enable portal
    const result = await prisma.$executeRawUnsafe(`
      UPDATE church_detail 
      SET portal_slug = $1, portal_enabled = true 
      WHERE church_name ILIKE $2
    `, slug, `%${orgName}%`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Portal enabled with slug: ${slug}`,
      rowsUpdated: result
    });
  } catch (error) {
    console.error('Enable portal error:', error);
    return NextResponse.json({ 
      error: 'Failed to enable portal', 
      details: (error as Error).message 
    }, { status: 500 });
  }
}

