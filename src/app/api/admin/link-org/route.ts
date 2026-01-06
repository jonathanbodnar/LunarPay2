import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// TEMPORARY ADMIN ENDPOINT - DELETE AFTER USE!
export async function POST(request: Request) {
  try {
    const { userId, organizationId } = await request.json();

    // Update the organization to be owned by the new user
    const org = await prisma.organization.update({
      where: { id: organizationId },
      data: { userId: userId },
    });

    return NextResponse.json({
      success: true,
      message: `Organization ${org.name} linked to user ${userId}`,
      organization: org,
    });
  } catch (error) {
    console.error('Link org error:', error);
    return NextResponse.json(
      { error: 'Failed to link organization', message: (error as Error).message },
      { status: 500 }
    );
  }
}

