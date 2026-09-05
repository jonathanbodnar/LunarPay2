import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/onboarding/mpa-embed?token=<org_token>
 *
 * Public API — returns the Fortis MPA link and onboarding status for a given
 * organization token. Used by the standalone onboarding page at
 * app.lunarpay.com/onboarding/[token], which opens the MPA top-level in a new
 * tab (Fortis's ClearApp is a cookie-session app; Safari blocks it in a
 * cross-site iframe).
 *
 * `appStatus` is always present (raw church_onboard_fortis.app_status or null).
 * `mpaLink` is returned whenever it exists — including PENDING_REVIEW /
 * APPROVED / DENIED — so the page can offer "open the application again".
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
        user: {
          select: {
            agencyId: true,
            agency: {
              select: {
                id: true,
                name: true,
                logo: true,
                primaryColor: true,
                hoverColor: true,
                email: true,
              },
            },
          },
        },
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
    const agency = organization.user?.agency || null;

    const agencyData = agency
      ? { name: agency.name, logo: agency.logo, primaryColor: agency.primaryColor, hoverColor: agency.hoverColor, email: agency.email || null }
      : null;

    if (appStatus === 'ACTIVE') {
      return NextResponse.json({
        status: 'active',
        appStatus,
        mpaLink: mpaLink || null,
        message: 'Merchant account is already active',
        organizationName: organization.name,
        organizationLogo: organization.logo,
        agency: agencyData,
      });
    }

    if (!mpaLink) {
      return NextResponse.json({
        status: appStatus || 'pending',
        appStatus: appStatus || null,
        mpaLink: null,
        message: 'MPA link is not available yet. Please complete Steps 1 and 2 first.',
        organizationName: organization.name,
        organizationLogo: organization.logo,
        agency: agencyData,
      });
    }

    return NextResponse.json({
      status: appStatus,
      appStatus,
      mpaLink,
      organizationName: organization.name,
      organizationLogo: organization.logo,
      agency: agencyData,
    });
  } catch (error) {
    console.error('[MPA Embed] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
