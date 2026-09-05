import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { syncOnboardingStatus } from '@/lib/fortis/onboarding-sync';

/**
 * Check Fortis application status
 * GET /api/fortis/check-status?organizationId=123
 *
 * Reconciles the organization's onboarding record with Fortis (stored-webhook
 * replay, approval detection via the users list) and returns the result.
 */
export const maxDuration = 60;

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
    const organizationIdParam = searchParams.get('organizationId');
    const organizationId = organizationIdParam ? parseInt(organizationIdParam, 10) : NaN;

    if (!organizationIdParam || isNaN(organizationId)) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      );
    }

    // Get organization and onboarding record (must belong to the signed-in user)
    const organization = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        userId: payload.userId,
      },
      select: {
        id: true,
        fortisOnboarding: { select: { id: true } },
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

    const result = await syncOnboardingStatus(organization.id, { cooldownMs: 15_000 });

    console.log('[Fortis Check Status] Result:', JSON.stringify(result));

    if (result.source === 'fortis_error') {
      return NextResponse.json({
        status: false,
        appStatus: result.status,
        message: result.message,
        updated: false,
        source: result.source,
      });
    }

    return NextResponse.json({
      status: true,
      appStatus: result.status,
      message: result.message,
      updated: result.changed,
      source: result.source,
    });
  } catch (error) {
    console.error('Check status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
