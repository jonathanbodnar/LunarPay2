import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * ADMIN ENDPOINT - Manually set Fortis credentials for an organization
 * Use this when webhook didn't fire and credentials need to be entered from Fortis dashboard
 * 
 * POST /api/admin/set-fortis-credentials
 * Body: { organizationId: number, authUserId: string, authUserApiKey: string, locationId?: string }
 * 
 * To get these credentials:
 * 1. Log into Fortis dashboard
 * 2. Find the merchant/location
 * 3. Go to API settings or user credentials section
 * 4. Copy user_id, user_api_key, and location_id
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { organizationId, authUserId, authUserApiKey, locationId } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      );
    }

    if (!authUserId || !authUserApiKey) {
      return NextResponse.json(
        { error: 'authUserId and authUserApiKey are required' },
        { status: 400 }
      );
    }

    // Get organization and onboarding record
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        fortisOnboarding: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    if (!organization.fortisOnboarding) {
      return NextResponse.json(
        { error: 'No Fortis onboarding record found. Organization must start onboarding first.' },
        { status: 404 }
      );
    }

    console.log('[Set Fortis Credentials] Organization:', organization.name);
    console.log('[Set Fortis Credentials] Previous status:', organization.fortisOnboarding.appStatus);

    // Update the credentials
    const updated = await prisma.fortisOnboarding.update({
      where: { id: organization.fortisOnboarding.id },
      data: {
        authUserId,
        authUserApiKey,
        locationId: locationId || organization.fortisOnboarding.locationId,
        appStatus: 'ACTIVE', // Setting credentials means they're approved
        updatedAt: new Date(),
      },
    });

    console.log('[Set Fortis Credentials] Updated successfully');

    return NextResponse.json({
      success: true,
      message: 'Fortis credentials updated successfully',
      organizationId,
      organizationName: organization.name,
      previousStatus: organization.fortisOnboarding.appStatus,
      newStatus: updated.appStatus,
      credentialsSet: {
        authUserId: 'SET',
        authUserApiKey: 'SET',
        locationId: updated.locationId ? 'SET' : 'NOT SET',
      },
    });
  } catch (error) {
    console.error('[Set Fortis Credentials] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for checking current credential status
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId');

  if (!organizationId) {
    return NextResponse.json(
      { error: 'organizationId query param is required' },
      { status: 400 }
    );
  }

  const organization = await prisma.organization.findUnique({
    where: { id: parseInt(organizationId) },
    include: {
      fortisOnboarding: true,
    },
  });

  if (!organization) {
    return NextResponse.json(
      { error: 'Organization not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    organizationId: organization.id,
    organizationName: organization.name,
    onboardingStatus: organization.fortisOnboarding?.appStatus || 'NOT STARTED',
    credentials: {
      authUserId: organization.fortisOnboarding?.authUserId ? 'SET' : 'NOT SET',
      authUserApiKey: organization.fortisOnboarding?.authUserApiKey ? 'SET' : 'NOT SET',
      locationId: organization.fortisOnboarding?.locationId || 'NOT SET',
    },
  });
}
