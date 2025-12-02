import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSuborgSchema = z.object({
  organizationId: z.number(),
  name: z.string().min(1),
  address: z.string().min(1),
  phone: z.string().min(1),
  pastor: z.string().min(1),
  description: z.string().min(1),
});

export async function GET() {
  try {
    const currentUser = await requireAuth();

    const suborganizations = await prisma.suborganization.findMany({
      where: {
        organization: {
          userId: currentUser.userId,
        },
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ suborganizations });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Get suborganizations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();
    const validatedData = createSuborgSchema.parse(body);

    // Verify organization ownership
    const organization = await prisma.organization.findFirst({
      where: {
        id: validatedData.organizationId,
        userId: currentUser.userId,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Create slug
    const slug = validatedData.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '');

    // Create suborganization
    const suborganization = await prisma.suborganization.create({
      data: {
        organizationId: validatedData.organizationId,
        name: validatedData.name,
        address: validatedData.address,
        phone: validatedData.phone,
        pastor: validatedData.pastor,
        description: validatedData.description,
        slug,
      },
      include: {
        organization: true,
      },
    });

    return NextResponse.json(
      { suborganization },
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

    console.error('Create suborganization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


