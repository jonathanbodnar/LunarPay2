import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createFortisClient } from '@/lib/fortis/client';
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

  const authorized =
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    (cronAdminKey && adminKey === cronAdminKey);

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

    const fortisClient = createFortisClient();
    const result = await fortisClient.getOnboardingStatus(organizationId.toString());

    if (!result.status || !result.data) {
      return NextResponse.json({
        message: 'Fortis returned no data',
        fortisResult: result,
        currentStatus: org.fortisOnboarding.appStatus,
      });
    }

    if (result.data.users && result.data.users.length > 0) {
      const merchantUser = result.data.users[0];

      let locationId: string | null = null;
      let productTransactionId: string | null = null;

      if (merchantUser.location_id) locationId = merchantUser.location_id;
      if (!locationId && merchantUser.locations?.length) locationId = merchantUser.locations[0].id;
      if (!locationId && result.data.locations?.length) {
        locationId = result.data.locations[0].id;
        if (result.data.locations[0].product_transactions?.length) {
          productTransactionId = result.data.locations[0].product_transactions[0].id;
        }
      }

      const previousStatus = org.fortisOnboarding.appStatus;

      await prisma.fortisOnboarding.update({
        where: { id: org.fortisOnboarding.id },
        data: {
          authUserId: merchantUser.user_id,
          authUserApiKey: merchantUser.user_api_key,
          locationId,
          productTransactionId,
          appStatus: 'ACTIVE',
          processorResponse: JSON.stringify(result.data),
          updatedAt: new Date(),
        },
      });

      notifyAgencyOfStatusChange(org.userId, organizationId, 'ACTIVE', previousStatus).catch(() => {});

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
