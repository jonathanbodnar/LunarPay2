import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createFortisClient } from '@/lib/fortis/client';

/**
 * Admin endpoint to fetch and update location_id for a merchant
 * POST /api/admin/fetch-location-id
 * Body: { organizationId: number }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { organizationId } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Get organization with Fortis onboarding
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
        { error: 'No Fortis onboarding record found' },
        { status: 404 }
      );
    }

    const { authUserId, authUserApiKey, locationId: existingLocationId } = organization.fortisOnboarding;

    if (!authUserId || !authUserApiKey) {
      return NextResponse.json(
        { error: 'Merchant not yet approved (no API credentials)' },
        { status: 400 }
      );
    }

    // If already has location_id, return it
    if (existingLocationId) {
      return NextResponse.json({
        success: true,
        message: 'Location ID already exists',
        locationId: existingLocationId,
        alreadyStored: true,
      });
    }

    // Determine environment
    const fortisEnv = process.env.fortis_environment || 'dev';
    const env = fortisEnv === 'prd' ? 'production' : 'sandbox';

    // Create Fortis client with merchant credentials
    const fortisClient = createFortisClient(
      env as 'sandbox' | 'production',
      authUserId,
      authUserApiKey
    );

    // Fetch locations from Fortis
    console.log('[Fetch Location] Fetching locations for org:', organizationId);
    const locationsResult = await fortisClient.getLocations();

    if (!locationsResult.status || !locationsResult.locations || locationsResult.locations.length === 0) {
      return NextResponse.json({
        success: false,
        error: locationsResult.message || 'No locations found',
        apiResponse: locationsResult,
      });
    }

    // Use the first location
    const location = locationsResult.locations[0];
    const locationId = location.id;

    console.log('[Fetch Location] Found location:', location);

    // Update the onboarding record
    await prisma.fortisOnboarding.update({
      where: { id: organization.fortisOnboarding.id },
      data: {
        locationId,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Location ID fetched and saved',
      locationId,
      locationName: location.name,
      allLocations: locationsResult.locations,
    });
  } catch (error) {
    console.error('[Fetch Location] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch location', details: String(error) },
      { status: 500 }
    );
  }
}

