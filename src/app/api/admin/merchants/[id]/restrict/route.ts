import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

// POST /api/admin/merchants/[id]/restrict - Restrict a merchant
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const organizationId = parseInt(id);

    if (isNaN(organizationId)) {
      return NextResponse.json({ error: 'Invalid organization ID' }, { status: 400 });
    }

    const body = await request.json();
    const { reason } = body;

    // Update the organization
    const organization = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        restricted: true,
        restrictedReason: reason || 'Account restricted by administrator',
        restrictedAt: new Date(),
      },
    });

    console.log(`[ADMIN] Organization ${organizationId} (${organization.name}) restricted by admin. Reason: ${reason}`);

    return NextResponse.json({
      success: true,
      message: `${organization.name} has been restricted`,
      organization: {
        id: organization.id,
        name: organization.name,
        restricted: organization.restricted,
        restrictedReason: organization.restrictedReason,
      },
    });
  } catch (error) {
    console.error('[ADMIN] Error restricting merchant:', error);
    return NextResponse.json(
      { error: 'Failed to restrict merchant' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/merchants/[id]/restrict - Unrestrict a merchant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const organizationId = parseInt(id);

    if (isNaN(organizationId)) {
      return NextResponse.json({ error: 'Invalid organization ID' }, { status: 400 });
    }

    // Update the organization
    const organization = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        restricted: false,
        restrictedReason: null,
        restrictedAt: null,
      },
    });

    console.log(`[ADMIN] Organization ${organizationId} (${organization.name}) unrestricted by admin`);

    return NextResponse.json({
      success: true,
      message: `${organization.name} has been unrestricted`,
      organization: {
        id: organization.id,
        name: organization.name,
        restricted: organization.restricted,
      },
    });
  } catch (error) {
    console.error('[ADMIN] Error unrestricting merchant:', error);
    return NextResponse.json(
      { error: 'Failed to unrestrict merchant' },
      { status: 500 }
    );
  }
}
