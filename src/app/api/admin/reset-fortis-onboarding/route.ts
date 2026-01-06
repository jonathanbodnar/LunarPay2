import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Reset Fortis onboarding for an organization
 * POST /api/admin/reset-fortis-onboarding
 * Body: { organizationName: string } or { organizationId: number }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { organizationName, organizationId } = body;

    let orgId = organizationId;

    // If name provided, look up the organization
    if (organizationName && !organizationId) {
      const org = await prisma.$queryRaw<Array<{ ch_id: number; church_name: string }>>`
        SELECT ch_id, church_name FROM church_detail 
        WHERE church_name ILIKE ${`%${organizationName}%`}
        LIMIT 1
      `;

      if (!org || org.length === 0) {
        return NextResponse.json(
          { error: `Organization "${organizationName}" not found` },
          { status: 404 }
        );
      }

      orgId = org[0].ch_id;
      console.log(`Found organization: ${org[0].church_name} (ID: ${orgId})`);
    }

    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization name or ID required' },
        { status: 400 }
      );
    }

    // Delete the fortis onboarding record
    const deleteResult = await prisma.$executeRaw`
      DELETE FROM church_onboard_fortis WHERE church_id = ${orgId}
    `;

    return NextResponse.json({
      success: true,
      message: `Fortis onboarding reset for organization ID ${orgId}`,
      deleted: deleteResult,
    });
  } catch (error) {
    console.error('Reset fortis onboarding error:', error);
    return NextResponse.json(
      { error: 'Failed to reset', details: (error as Error).message },
      { status: 500 }
    );
  }
}

