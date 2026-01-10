import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { FortisClient } from '@/lib/fortis/client';

/**
 * Check Fortis application status
 * GET /api/fortis/check-status?organizationId=123
 */
export async function GET(request: Request) {
  try {
    // Verify authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('lunarpay_token');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token.value);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get organizationId from query params
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      );
    }

    // Get organization and onboarding record
    const organization = await prisma.organization.findFirst({
      where: {
        id: parseInt(organizationId),
        userId: payload.userId,
      },
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

    // If already active, just return current status
    if (organization.fortisOnboarding.appStatus === 'ACTIVE') {
      return NextResponse.json({
        status: true,
        appStatus: 'ACTIVE',
        message: 'Application already approved',
      });
    }

    // Initialize Fortis client
    const fortisClient = new FortisClient({
      developerId: process.env.FORTIS_DEVELOPER_ID || '',
      userId: process.env.FORTIS_USER_ID || '',
      userApiKey: process.env.FORTIS_USER_API_KEY || '',
      environment: (process.env.FORTIS_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
    });

    // Check status from Fortis
    const result = await fortisClient.getOnboardingStatus(organizationId);

    console.log('[Fortis Check Status] Result:', JSON.stringify(result, null, 2));

    if (!result.status) {
      return NextResponse.json({
        status: false,
        appStatus: organization.fortisOnboarding.appStatus,
        message: result.message || 'Could not fetch status from Fortis',
      });
    }

    // If Fortis returned user credentials, update our database
    if (result.data?.users && result.data.users.length > 0) {
      const merchantUser = result.data.users[0];
      
      // Extract location_id
      let locationId: string | null = null;
      if (merchantUser.location_id) {
        locationId = merchantUser.location_id;
      } else if (merchantUser.locations && merchantUser.locations.length > 0) {
        locationId = merchantUser.locations[0].id;
      } else if (result.data.locations && result.data.locations.length > 0) {
        locationId = result.data.locations[0].id;
      }

      // Update onboarding record
      await prisma.fortisOnboarding.update({
        where: { id: organization.fortisOnboarding.id },
        data: {
          authUserId: merchantUser.user_id,
          authUserApiKey: merchantUser.user_api_key,
          locationId: locationId,
          appStatus: 'ACTIVE',
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        status: true,
        appStatus: 'ACTIVE',
        message: 'Application approved! Credentials updated from API.',
        updated: true,
        source: 'fortis_api',
      });
    }

    // FALLBACK: If Fortis API didn't return credentials, check stored webhooks
    // We may have received the webhook but failed to parse it (data was nested)
    console.log('[Fortis Check Status] No credentials from API, checking stored webhooks...');
    
    const storedWebhook = await prisma.fortisWebhook.findFirst({
      where: {
        eventJson: {
          contains: `"client_app_id":"${organizationId}"`,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (storedWebhook) {
      console.log('[Fortis Check Status] Found stored webhook, attempting to extract credentials...');
      
      try {
        const webhookPayload = JSON.parse(storedWebhook.eventJson);
        
        // Handle both { users: [...] } and { data: { users: [...] } } formats
        const webhookData = webhookPayload.data || webhookPayload;
        
        if (webhookData.users && webhookData.users.length > 0) {
          const merchantUser = webhookData.users[0];
          
          // Extract location_id from webhook
          let locationId = webhookData.location_id || null;
          if (!locationId && merchantUser.location_id) {
            locationId = merchantUser.location_id;
          }
          if (!locationId && merchantUser.locations && merchantUser.locations.length > 0) {
            locationId = merchantUser.locations[0].id;
          }
          
          console.log('[Fortis Check Status] Extracted from stored webhook:', {
            userId: merchantUser.user_id,
            hasApiKey: !!merchantUser.user_api_key,
            locationId,
          });

          // Update onboarding record with credentials from stored webhook
          await prisma.fortisOnboarding.update({
            where: { id: organization.fortisOnboarding.id },
            data: {
              authUserId: merchantUser.user_id,
              authUserApiKey: merchantUser.user_api_key,
              locationId: locationId || organization.fortisOnboarding.locationId,
              appStatus: 'ACTIVE',
              updatedAt: new Date(),
            },
          });

          return NextResponse.json({
            status: true,
            appStatus: 'ACTIVE',
            message: 'Application approved! Credentials recovered from stored webhook.',
            updated: true,
            source: 'stored_webhook',
          });
        }
      } catch (parseError) {
        console.error('[Fortis Check Status] Failed to parse stored webhook:', parseError);
      }
    }

    // Return current status from Fortis
    return NextResponse.json({
      status: true,
      appStatus: result.data?.status || organization.fortisOnboarding.appStatus,
      fortisStatus: result.data?.status,
      statusMessage: result.data?.status_message,
      message: 'Status checked successfully. No new credentials found.',
    });
  } catch (error) {
    console.error('Check status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

