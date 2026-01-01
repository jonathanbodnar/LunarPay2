import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Save merchant info step data (before submitting to Fortis)
 * This allows data to persist across page refreshes
 */
export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();

    const {
      organizationId,
      step,
      signFirstName,
      signLastName,
      signPhoneNumber,
      email,
      dbaName,
      legalName,
      website,
      addressLine1,
      state,
      city,
      postalCode,
    } = body;

    // Verify user owns this organization
    const organization = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        userId: currentUser.userId,
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

    // Update organization with business info
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        name: dbaName || organization.name,
        legalName: legalName || undefined,
        website: website || undefined,
      },
    });

    // Save onboarding step data
    const onboardingData = {
      signFirstName,
      signLastName,
      signPhoneNumber,
      email,
      merchantAddressLine1: addressLine1,
      merchantState: state,
      merchantCity: city,
      merchantPostalCode: postalCode,
      stepCompleted: step,
    };

    if (organization.fortisOnboarding) {
      await prisma.fortisOnboarding.update({
        where: { organizationId },
        data: onboardingData,
      });
    } else {
      await prisma.fortisOnboarding.create({
        data: {
          ...onboardingData,
          userId: currentUser.userId,
          organizationId,
        },
      });
    }

    return NextResponse.json({
      status: true,
      message: 'Step data saved',
    });
  } catch (error) {
    console.error('Save step error:', error);
    
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

