import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FortisClient } from '@/lib/fortis/client';

/**
 * ADMIN ENDPOINT - Sync Fortis credentials for an organization
 * Use when webhook didn't fire or credentials weren't saved
 * 
 * POST /api/admin/sync-fortis-credentials
 * Body: { organizationId: number }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { organizationId } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required' },
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
        { error: 'No Fortis onboarding record found' },
        { status: 404 }
      );
    }

    console.log('[Sync Fortis] Organization:', organization.name);
    console.log('[Sync Fortis] Current status:', organization.fortisOnboarding.appStatus);
    console.log('[Sync Fortis] Current authUserId:', organization.fortisOnboarding.authUserId ? 'SET' : 'NOT SET');
    console.log('[Sync Fortis] Current locationId:', organization.fortisOnboarding.locationId);

    // Initialize Fortis client with platform credentials
    const fortisEnv = process.env.fortis_environment || 'dev';
    const env = fortisEnv === 'prd' ? 'production' : 'sandbox';
    
    const fortisClient = new FortisClient({
      developerId: process.env.FORTIS_DEVELOPER_ID || '',
      userId: process.env.FORTIS_USER_ID || '',
      userApiKey: process.env.FORTIS_USER_API_KEY || '',
      environment: env as 'sandbox' | 'production',
    });

    // Check onboarding status from Fortis
    // client_app_id is the organization ID we sent during onboarding
    const clientAppId = organizationId.toString();
    console.log('[Sync Fortis] Fetching status for client_app_id:', clientAppId);

    const result = await fortisClient.getOnboardingStatus(clientAppId);

    console.log('[Sync Fortis] Fortis API response:', JSON.stringify(result, null, 2));

    if (!result.status) {
      return NextResponse.json({
        success: false,
        error: result.message || 'Could not fetch status from Fortis',
        currentStatus: organization.fortisOnboarding.appStatus,
      });
    }

    // Extract credentials from Fortis response
    let authUserId: string | null = null;
    let authUserApiKey: string | null = null;
    let locationId: string | null = null;
    let productTransactionId: string | null = null;
    let newStatus: string = organization.fortisOnboarding.appStatus || 'UNKNOWN';

    // Check various locations for credentials in the Fortis response
    if (result.data) {
      const data = result.data;
      
      // Update status
      if (data.status) {
        newStatus = data.status;
      }

      // Extract user credentials
      if (data.users && data.users.length > 0) {
        const user = data.users[0];
        authUserId = user.user_id || null;
        authUserApiKey = user.user_api_key || null;
        
        if (user.location_id) {
          locationId = user.location_id;
        } else if (user.locations && user.locations.length > 0) {
          locationId = user.locations[0].id;
        }
      }

      // Extract location from top-level
      if (!locationId && data.locations && data.locations.length > 0) {
        locationId = data.locations[0].id;
        
        if (data.locations[0].product_transactions && data.locations[0].product_transactions.length > 0) {
          productTransactionId = data.locations[0].product_transactions[0].id;
        }
      }
    }

    console.log('[Sync Fortis] Extracted:', {
      newStatus,
      authUserId: authUserId ? 'FOUND' : 'NOT FOUND',
      authUserApiKey: authUserApiKey ? 'FOUND' : 'NOT FOUND',
      locationId,
      productTransactionId,
    });

    // If we have credentials, update the database
    const updates: any = {
      updatedAt: new Date(),
    };

    if (newStatus === 'ACTIVE' || newStatus === 'approved' || newStatus === 'Activated') {
      updates.appStatus = 'ACTIVE';
    } else if (newStatus) {
      updates.appStatus = newStatus;
    }

    if (authUserId) updates.authUserId = authUserId;
    if (authUserApiKey) updates.authUserApiKey = authUserApiKey;
    if (locationId) updates.locationId = locationId;
    if (productTransactionId) updates.productTransactionId = productTransactionId;

    // Update the database
    const updated = await prisma.fortisOnboarding.update({
      where: { id: organization.fortisOnboarding.id },
      data: updates,
    });

    return NextResponse.json({
      success: true,
      organizationName: organization.name,
      previousStatus: organization.fortisOnboarding.appStatus,
      newStatus: updated.appStatus,
      credentialsUpdated: !!(authUserId || authUserApiKey || locationId),
      fortisResponse: result.data,
      updates: {
        authUserId: authUserId ? 'SET' : 'NOT CHANGED',
        authUserApiKey: authUserApiKey ? 'SET' : 'NOT CHANGED',
        locationId: locationId || 'NOT CHANGED',
        appStatus: updates.appStatus || 'NOT CHANGED',
      },
    });
  } catch (error) {
    console.error('[Sync Fortis] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// Also support GET for easy testing
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId');

  if (!organizationId) {
    return NextResponse.json(
      { error: 'organizationId query param is required' },
      { status: 400 }
    );
  }

  // Create a fake request with the body
  const fakeRequest = {
    json: async () => ({ organizationId: parseInt(organizationId) }),
  } as Request;

  return POST(fakeRequest);
}

