import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/onboarding/account-status?organizationId=1
 * 
 * Get account/onboarding status for an organization
 * Matching PHP: Getting_started_fts->getOnboardingStatus()
 * 
 * Returns:
 * - app_status: Application status (PENDING, BANK_INFORMATION_SENT, ACTIVE, etc.)
 * - mpa_link: Merchant Processing Application link (if available)
 */
export async function GET(request: Request) {
  try {
    const currentUser = await requireAuth();
    const { searchParams } = new URL(request.url);
    const organizationId = parseInt(searchParams.get('organizationId') || '0');

    if (!organizationId) {
      return NextResponse.json(
        { status: false, message: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Verify user owns this organization
    const organization = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        userId: currentUser.userId,
      },
      include: {
        fortisOnboarding: {
          select: {
            id: true,
            appStatus: true,
            mpaLink: true,
            stepCompleted: true,
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { status: false, message: 'Organization not found or access denied' },
        { status: 404 }
      );
    }

    // Get onboarding status matching PHP getOnboardingStatus()
    if (organization.fortisOnboarding) {
      // Update stepCompleted to 5 when status is checked (Step 5: Account Status)
      if ((organization.fortisOnboarding.stepCompleted ?? 0) < 5) {
        await prisma.fortisOnboarding.update({
          where: { id: organization.fortisOnboarding.id },
          data: { stepCompleted: 5 },
        });
      }

      return NextResponse.json({
        status: true,
        app_status: organization.fortisOnboarding.appStatus || null,
        mpa_link: organization.fortisOnboarding.mpaLink || null,
        stepCompleted: 5,
      });
    } else {
      // No onboarding record found - return null values matching PHP behavior
      return NextResponse.json({
        status: true,
        app_status: null,
        mpa_link: null,
      });
    }
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { status: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Get account status error:', error);
    return NextResponse.json(
      { status: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

