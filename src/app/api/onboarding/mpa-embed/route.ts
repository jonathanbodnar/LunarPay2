import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/onboarding/mpa-embed?token=<org_token>
 *
 * Public API — returns the Fortis MPA embed URL for a given organization token.
 * Used by the standalone onboarding page at app.lunarpay.com/onboarding/[token]
 * which must be served from that domain for Fortis iframe whitelisting.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Organization token is required' },
        { status: 400 }
      );
    }

    const organization = await prisma.organization.findUnique({
      where: { token },
      select: {
        id: true,
        name: true,
        logo: true,
        fortisOnboarding: {
          select: {
            appStatus: true,
            mpaLink: true,
          },
        },
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
        { error: 'Onboarding has not been started' },
        { status: 404 }
      );
    }

    const { appStatus, mpaLink } = organization.fortisOnboarding;

    if (appStatus === 'ACTIVE') {
      return NextResponse.json({
        status: 'active',
        message: 'Merchant account is already active',
        organizationName: organization.name,
      });
    }

    if (!mpaLink) {
      return NextResponse.json({
        status: appStatus || 'pending',
        message: 'MPA link is not available yet. Please complete Steps 1 and 2 first.',
        organizationName: organization.name,
      });
    }

    return NextResponse.json({
      status: appStatus,
      mpaLink,
      organizationName: organization.name,
      organizationLogo: organization.logo,
    });
  } catch (error) {
    console.error('[MPA Embed] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
