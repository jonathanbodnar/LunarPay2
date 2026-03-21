/**
 * GET /api/v1/agency/merchants/:id — Get merchant details including API keys and status
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAgencyKey, ApiAuthError, apiError } from '@/lib/api-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const agency = await requireAgencyKey(request);
    const { id } = await params;
    const merchantId = parseInt(id);
    if (isNaN(merchantId)) return apiError('Invalid merchant ID', 400);

    const user = await prisma.user.findFirst({
      where: { id: merchantId, agencyId: agency.agencyId },
      include: {
        organizations: {
          take: 1,
          include: {
            fortisOnboarding: {
              select: {
                appStatus: true,
                mpaLink: true,
                stepCompleted: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    });

    if (!user) return apiError('Merchant not found', 404);

    // Get API keys via raw query
    const keyRows = await prisma.$queryRaw<{ publishable_key: string | null; secret_key: string | null }[]>`
      SELECT publishable_key, secret_key FROM users WHERE id = ${user.id}
    `;
    const keys = keyRows[0];

    const org = user.organizations[0];
    const onboarding = org?.fortisOnboarding;

    return Response.json({
      data: {
        merchantId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        businessName: org?.name || null,
        organizationId: org?.id || null,
        orgToken: org?.token || null,
        publishableKey: keys?.publishable_key || null,
        secretKey: keys?.secret_key || null,
        onboarding: {
          status: onboarding?.appStatus || 'PENDING',
          isActive: onboarding?.appStatus === 'ACTIVE',
          stepCompleted: onboarding?.stepCompleted ?? 0,
          mpaLink: onboarding?.mpaLink || null,
          mpaEmbedUrl: onboarding?.mpaLink && org
            ? `https://app.lunarpay.com/onboarding/${org.token}`
            : null,
          createdAt: onboarding?.createdAt || null,
          updatedAt: onboarding?.updatedAt || null,
        },
        createdAt: user.createdOn,
      },
    });
  } catch (e) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    console.error('[v1/agency/merchants/:id GET]', e);
    return apiError('Internal server error', 500);
  }
}
