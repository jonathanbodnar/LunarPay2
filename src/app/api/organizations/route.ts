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

    // Query organizations - use try/catch for graceful handling
    let organizations;
    try {
      organizations = await prisma.organization.findMany({
        where: {
          userId: currentUser.userId,
        },
        include: {
          fortisOnboarding: {
            select: {
              appStatus: true,
              mpaLink: true,
              stepCompleted: true,
              signFirstName: true,
              signLastName: true,
              signPhoneNumber: true,
              email: true,
              merchantAddressLine1: true,
              merchantCity: true,
              merchantState: true,
              merchantPostalCode: true,
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
    } catch (prismaError) {
      // If there's a column error, try a simpler query
      console.error('Prisma query failed, trying fallback:', prismaError);
      
      // Raw SQL fallback that only uses core columns
      const rawOrgs = await prisma.$queryRaw<Array<{
        ch_id: number;
        client_id: number;
        church_name: string;
        legal_name: string | null;
        phone_no: string | null;
        website: string | null;
        email: string | null;
        street_address: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
        postal: string | null;
        token: string;
        slug: string | null;
        logo: string | null;
        primary_color: string | null;
      }>>`
        SELECT ch_id, client_id, church_name, legal_name, phone_no, website, 
               email, street_address, city, state, country, postal, token, 
               slug, logo, primary_color
        FROM church_detail 
        WHERE client_id = ${currentUser.userId}
        ORDER BY ch_id ASC
      `;
      
      organizations = rawOrgs.map(org => ({
        id: org.ch_id,
        userId: org.client_id,
        name: org.church_name,
        legalName: org.legal_name,
        phoneNumber: org.phone_no,
        website: org.website,
        email: org.email,
        streetAddress: org.street_address,
        city: org.city,
        state: org.state,
        country: org.country,
        postal: org.postal,
        token: org.token,
        slug: org.slug,
        logo: org.logo,
        primaryColor: org.primary_color,
        fortisOnboarding: null,
        _count: { invoices: 0, donors: 0, funds: 0 },
      }));
    }

    return NextResponse.json({ organizations });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Get organizations error:', error);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
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

