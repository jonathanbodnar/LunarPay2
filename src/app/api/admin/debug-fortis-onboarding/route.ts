import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Debug endpoint to check Fortis onboarding status
 * GET /api/admin/debug-fortis-onboarding?orgId=8
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const orgId = url.searchParams.get('orgId');

    if (!orgId) {
      // Return all orgs with Fortis onboarding
      const allOnboarding = await prisma.fortisOnboarding.findMany({
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return NextResponse.json({
        count: allOnboarding.length,
        onboardings: allOnboarding.map((o) => ({
          id: o.id,
          orgId: o.organizationId,
          orgName: o.organization?.name,
          appStatus: o.appStatus,
          hasAuthUserId: !!o.authUserId,
          hasAuthApiKey: !!o.authUserApiKey,
          hasLocationId: !!o.locationId,
          locationId: o.locationId,
          mpaLink: o.mpaLink ? o.mpaLink.substring(0, 50) + '...' : null,
        })),
      });
    }

    const onboarding = await prisma.fortisOnboarding.findFirst({
      where: { organizationId: parseInt(orgId) },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!onboarding) {
      return NextResponse.json({
        error: 'No Fortis onboarding found for org ' + orgId,
      });
    }

    return NextResponse.json({
      id: onboarding.id,
      organizationId: onboarding.organizationId,
      orgName: onboarding.organization?.name,
      appStatus: onboarding.appStatus,
      hasAuthUserId: !!onboarding.authUserId,
      authUserIdPreview: onboarding.authUserId?.substring(0, 12) + '...',
      hasAuthApiKey: !!onboarding.authUserApiKey,
      hasLocationId: !!onboarding.locationId,
      locationId: onboarding.locationId,
      mpaLink: onboarding.mpaLink,
      createdAt: onboarding.createdAt,
      updatedAt: onboarding.updatedAt,
    });
  } catch (error) {
    console.error('Debug fortis onboarding error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

