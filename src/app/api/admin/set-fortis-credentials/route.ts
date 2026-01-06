import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Admin endpoint to manually set Fortis credentials
 * POST /api/admin/set-fortis-credentials
 * Body: { churchId: number, authUserId: string, authUserApiKey: string, locationId?: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { churchId, authUserId, authUserApiKey, locationId } = body;

    if (!churchId) {
      return NextResponse.json(
        { error: 'churchId is required' },
        { status: 400 }
      );
    }

    // Find the onboarding record
    const onboarding = await prisma.fortisOnboarding.findFirst({
      where: { organizationId: churchId },
    });

    if (!onboarding) {
      return NextResponse.json(
        { error: `No Fortis onboarding record found for churchId ${churchId}` },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (authUserId) {
      updateData.authUserId = authUserId;
    }
    if (authUserApiKey) {
      updateData.authUserApiKey = authUserApiKey;
    }
    if (locationId) {
      updateData.locationId = locationId;
    }

    // Update the record
    const updated = await prisma.fortisOnboarding.update({
      where: { id: onboarding.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: `Fortis credentials updated for churchId ${churchId}`,
      updated: {
        id: updated.id,
        hasAuthUserId: !!updated.authUserId,
        hasAuthApiKey: !!updated.authUserApiKey,
        hasLocationId: !!updated.locationId,
        locationId: updated.locationId,
      },
    });
  } catch (error) {
    console.error('[Set Fortis Credentials] Error:', error);
    return NextResponse.json(
      { error: 'Failed to set credentials', details: String(error) },
      { status: 500 }
    );
  }
}

