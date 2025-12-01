import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateRandomToken, generateSlug } from '@/lib/utils';
import { z } from 'zod';

const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  legalName: z.string().optional(),
  phoneNumber: z.string().optional(),
  website: z.string().optional(),
  email: z.string().email().optional(),
  streetAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal: z.string().optional(),
  country: z.string().optional(),
});

// GET /api/organizations - List all organizations for current user
export async function GET() {
  try {
    const currentUser = await requireAuth();

    const organizations = await prisma.organization.findMany({
      where: {
        userId: currentUser.userId,
      },
      include: {
        fortisOnboarding: {
          select: {
            appStatus: true,
            mpaLink: true,
          },
        },
        _count: {
          select: {
            invoices: true,
            donors: true,
            funds: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    return NextResponse.json({ organizations });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Get organizations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/organizations - Create new organization
export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();

    const validatedData = createOrganizationSchema.parse(body);

    // Generate unique token and slug
    const token = generateRandomToken(32);
    const baseSlug = generateSlug(validatedData.name);
    
    // Ensure slug is unique
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.organization.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create organization
    const organization = await prisma.organization.create({
      data: {
        userId: currentUser.userId,
        name: validatedData.name,
        legalName: validatedData.legalName,
        phoneNumber: validatedData.phoneNumber,
        website: validatedData.website,
        email: validatedData.email,
        streetAddress: validatedData.streetAddress,
        city: validatedData.city,
        state: validatedData.state,
        postal: validatedData.postal,
        country: validatedData.country,
        token,
        slug,
      },
    });

    // Create default fund
    await prisma.fund.create({
      data: {
        userId: currentUser.userId,
        organizationId: organization.id,
        name: 'General Fund',
        description: 'Default fund for all donations',
        isActive: true,
      },
    });

    // Create chat settings
    await prisma.chatSetting.create({
      data: {
        userId: currentUser.userId,
        organizationId: organization.id,
        primaryColor: '#007bff',
        themeColor: '#007bff',
        widgetPosition: 'bottom-right',
      },
    });

    // Create Fortis onboarding record
    await prisma.fortisOnboarding.create({
      data: {
        userId: currentUser.userId,
        organizationId: organization.id,
        appStatus: 'PENDING',
      },
    });

    return NextResponse.json(
      { organization },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Create organization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

