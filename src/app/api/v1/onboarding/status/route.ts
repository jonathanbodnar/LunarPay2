/**
 * GET /api/v1/onboarding/status — Get merchant onboarding status
 *
 * Returns the current onboarding state, MPA link, and whether the
 * merchant account is active and ready to process payments.
 *
 * Auth: secret key (lp_sk_), does NOT require ACTIVE status.
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSecretKey, ApiAuthError, apiError } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSecretKey(request, { requireActive: false });

    const org = await prisma.organization.findUnique({
      where: { id: auth.organizationId },
      select: {
        id: true,
        name: true,
        token: true,
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
    });

    if (!org) {
      return apiError('Organization not found', 404);
    }

    const onboarding = org.fortisOnboarding;
    const appStatus = onboarding?.appStatus || 'PENDING';

    return Response.json({
      organizationId: org.id,
      organizationName: org.name,
      status: appStatus,
      isActive: appStatus === 'ACTIVE',
      stepCompleted: onboarding?.stepCompleted ?? 0,
      mpaLink: onboarding?.mpaLink || null,
      mpaEmbedUrl: onboarding?.mpaLink
        ? `https://app.lunarpay.com/onboarding/${org.token}`
        : null,
      createdAt: onboarding?.createdAt || null,
      updatedAt: onboarding?.updatedAt || null,
    });
  } catch (err) {
    if (err instanceof ApiAuthError) {
      return apiError(err.message, err.statusCode);
    }
    console.error('[v1/onboarding/status]', err);
    return apiError('Internal server error', 500);
  }
}
