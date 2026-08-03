import { NextResponse, after } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FortisClient, createFortisClient } from '@/lib/fortis/client';
import { notifyAgencyOfStatusChange } from '@/lib/agency-webhook';

/**
 * POST /api/admin/recover-status
 * Recover merchant onboarding credentials from Fortis when the webhook was missed.
 * Requires CRON_SECRET header for authentication.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const { searchParams } = new URL(request.url);
  const adminKey = searchParams.get('admin_key');
  const cronAdminKey = process.env.CRON_ADMIN_KEY;
  const oneTimeToken = searchParams.get('token');

  const authorized =
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    (cronAdminKey && adminKey === cronAdminKey) ||
    false; // one-time token removed

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const organizationId = body.organizationId;

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId required' }, { status: 400 });
    }

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: { fortisOnboarding: true },
    });

    if (!org || !org.fortisOnboarding) {
      return NextResponse.json({ error: 'Organization or onboarding not found' }, { status: 404 });
    }

    if (org.fortisOnboarding.appStatus === 'ACTIVE') {
      return NextResponse.json({ message: 'Already ACTIVE', status: org.fortisOnboarding.appStatus });
    }

    // Try both client construction methods to handle different env var naming
    let result: any = null;
    let clientUsed = '';

    // Method 1: Same as check-status endpoint (generic env vars)
    try {
      const client1 = new FortisClient({
        developerId: process.env.FORTIS_DEVELOPER_ID || '',
        userId: process.env.FORTIS_USER_ID || '',
        userApiKey: process.env.FORTIS_USER_API_KEY || '',
        environment: (process.env.FORTIS_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
      });
      result = await client1.getOnboardingStatus(organizationId.toString());
      clientUsed = 'generic';
    } catch {}

    // Method 2: Factory function (suffixed env vars)
    if (!result?.status) {
      try {
        const client2 = createFortisClient();
        result = await client2.getOnboardingStatus(organizationId.toString());
        clientUsed = 'factory';
      } catch {}
    }

    if (!result?.status || !result?.data) {
      return NextResponse.json({
        message: 'Fortis returned no data',
        fortisResult: result,
        currentStatus: org.fortisOnboarding.appStatus,
        clientUsed,
        envDebug: {
          hasFortisDevId: !!process.env.FORTIS_DEVELOPER_ID,
          hasFortisUserId: !!process.env.FORTIS_USER_ID,
          hasFortisUserApiKey: !!process.env.FORTIS_USER_API_KEY,
          hasFortisEnv: process.env.FORTIS_ENVIRONMENT || 'not set',
          hasFortisDevIdProd: !!process.env.FORTIS_DEVELOPER_ID_PRODUCTION,
          hasFortisDevIdSandbox: !!process.env.FORTIS_DEVELOPER_ID_SANDBOX,
          hasLowerDevId: !!process.env.fortis_developer_id_production,
          hasLowerUserId: !!process.env.fortis_onboarding_user_id_production,
          fortisEnvLower: process.env.fortis_environment || 'not set',
        },
      });
    }

    if (result.data.users && result.data.users.length > 0) {
      const merchantUser = result.data.users[0];

      let locationId: string | null = null;
      let ccProductTransactionId: string | null = null;
      let achProductTransactionId: string | null = null;

      // Fortis returns location_id and product_transactions at the TOP LEVEL of
      // the application record — verified against a real production response.
      // There is no `locations` array, so the old
      // `result.data.locations[0].product_transactions[0]` read resolved to
      // nothing: this route activated merchants with a null product id, and
      // /v1/intentions then rejected every card and ACH intention with "not
      // enabled for this merchant" — ACTIVE but unable to take a payment.
      if (result.data.location_id) locationId = result.data.location_id;
      if (!locationId && merchantUser.location_id) locationId = merchantUser.location_id;
      if (!locationId && merchantUser.locations?.length) locationId = merchantUser.locations[0].id;
      if (!locationId && result.data.locations?.length) locationId = result.data.locations[0].id;

      // Resolve card and ACH products by payment_method, not by position.
      for (const pt of result.data.product_transactions ?? []) {
        const method = pt.payment_method?.toLowerCase();
        if (method === 'cc' && !ccProductTransactionId) ccProductTransactionId = pt.id;
        if (method === 'ach' && !achProductTransactionId) achProductTransactionId = pt.id;
      }
      for (const loc of result.data.locations ?? []) {
        for (const pt of loc.product_transactions ?? []) {
          const method = pt.payment_method?.toLowerCase();
          if (method === 'cc' && !ccProductTransactionId) ccProductTransactionId = pt.id;
          if (method === 'ach' && !achProductTransactionId) achProductTransactionId = pt.id;
        }
      }

      // Fortis's application record does not always carry payment_method on the
      // nested products; ask the location directly with the merchant's own
      // credentials before settling for nothing.
      if (!ccProductTransactionId && !achProductTransactionId && locationId) {
        try {
          const merchantClient = createFortisClient(
            (process.env.fortis_environment === 'prd' ? 'production' : 'sandbox'),
            merchantUser.user_id,
            merchantUser.user_api_key
          );
          const loc = await merchantClient.getLocation(locationId, {
            expand: ['product_transactions'],
          });
          for (const pt of loc.location?.product_transactions ?? []) {
            const method = pt.payment_method?.toLowerCase();
            if (method === 'cc' && !ccProductTransactionId) ccProductTransactionId = pt.id;
            if (method === 'ach' && !achProductTransactionId) achProductTransactionId = pt.id;
          }
        } catch (e) {
          console.error('[Admin Recover Status] Location product lookup failed:', e);
        }
      }

      const previousStatus = org.fortisOnboarding.appStatus;

      await prisma.fortisOnboarding.update({
        where: { id: org.fortisOnboarding.id },
        data: {
          authUserId: merchantUser.user_id,
          authUserApiKey: merchantUser.user_api_key,
          locationId: locationId ?? org.fortisOnboarding.locationId,
          // Never downgrade an id we already hold to null.
          productTransactionId:
            ccProductTransactionId ||
            achProductTransactionId ||
            org.fortisOnboarding.productTransactionId ||
            null,
          achProductTransactionId:
            achProductTransactionId || org.fortisOnboarding.achProductTransactionId || null,
          appStatus: 'ACTIVE',
          processorResponse: JSON.stringify(result.data),
          updatedAt: new Date(),
        },
      });

      after(() =>
        notifyAgencyOfStatusChange(org.userId, organizationId, 'ACTIVE', previousStatus)
      );

      return NextResponse.json({
        message: 'Recovered! Status updated to ACTIVE',
        organizationId,
        locationId,
        hasCredentials: true,
      });
    }

    return NextResponse.json({
      message: 'Fortis responded but no user credentials yet',
      fortisStatus: result.data.status,
      statusMessage: result.data.status_message,
      currentStatus: org.fortisOnboarding.appStatus,
    });
  } catch (error) {
    console.error('[Admin Recover Status] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
