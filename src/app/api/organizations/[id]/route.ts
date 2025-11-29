import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/organizations/:id - Get single organization
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await requireAuth();
    const organizationId = parseInt(params.id);

    const organization = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        userId: currentUser.userId,
      },
      include: {
        fortisOnboarding: true,
        chatSettings: true,
        funds: {
          where: { isActive: true },
          orderBy: { id: 'asc' },
        },
        subOrganizations: {
          orderBy: { id: 'asc' },
        },
        _count: {
          select: {
            invoices: true,
            donors: true,
            products: true,
            paymentLinks: true,
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

    return NextResponse.json({ organization });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Get organization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/organizations/:id - Update organization
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await requireAuth();
    const organizationId = parseInt(params.id);
    const body = await request.json();

    // Verify ownership
    const existing = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        userId: currentUser.userId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Update organization
    const organization = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        name: body.name,
        legalName: body.legalName,
        phoneNumber: body.phoneNumber,
        website: body.website,
        email: body.email,
        streetAddress: body.streetAddress,
        streetAddressSuite: body.streetAddressSuite,
        city: body.city,
        state: body.state,
        postal: body.postal,
        country: body.country,
        logo: body.logo,
      },
    });

    return NextResponse.json({ organization });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Update organization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/organizations/:id - Delete organization
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await requireAuth();
    const organizationId = parseInt(params.id);

    // Verify ownership
    const existing = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        userId: currentUser.userId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Delete organization (cascade will handle related records)
    await prisma.organization.delete({
      where: { id: organizationId },
    });

    return NextResponse.json({
      message: 'Organization deleted successfully',
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Delete organization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

