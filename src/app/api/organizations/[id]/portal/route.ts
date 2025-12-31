import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const portalSettingsSchema = z.object({
  portalSlug: z.string()
    .min(3, 'Portal slug must be at least 3 characters')
    .max(100, 'Portal slug must be 100 characters or less')
    .regex(/^[a-z0-9-]+$/, 'Portal slug can only contain lowercase letters, numbers, and hyphens')
    .transform(val => val || null),
  portalEnabled: z.boolean().optional(),
  portalCustomDomain: z.string().max(255).optional().nullable().transform(val => val?.trim() || null),
  portalTitle: z.string().max(255).optional().nullable().transform(val => val?.trim() || null),
  portalDescription: z.string().max(1000).optional().nullable().transform(val => val?.trim() || null),
});

// GET /api/organizations/:id/portal - Get portal settings
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const organizationId = parseInt(id);

    const organization = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        userId: currentUser.userId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        portalSlug: true,
        portalEnabled: true,
        portalCustomDomain: true,
        portalTitle: true,
        portalDescription: true,
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Get portal settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/organizations/:id/portal - Update portal settings
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const organizationId = parseInt(id);
    const body = await request.json();

    const validatedData = portalSettingsSchema.parse(body);

    // Verify organization belongs to user
    const organization = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        userId: currentUser.userId,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if portal slug is already taken by another org
    if (validatedData.portalSlug) {
      const existingSlug = await prisma.organization.findFirst({
        where: {
          OR: [
            { portalSlug: validatedData.portalSlug },
            { slug: validatedData.portalSlug },
          ],
          id: { not: organizationId },
        },
      });

      if (existingSlug) {
        return NextResponse.json(
          { error: 'This portal URL is already taken' },
          { status: 400 }
        );
      }
    }

    // Update organization with portal settings
    const updatedOrganization = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        portalSlug: validatedData.portalSlug,
        portalEnabled: validatedData.portalEnabled,
        portalCustomDomain: validatedData.portalCustomDomain || null,
        portalTitle: validatedData.portalTitle || null,
        portalDescription: validatedData.portalDescription || null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        portalSlug: true,
        portalEnabled: true,
        portalCustomDomain: true,
        portalTitle: true,
        portalDescription: true,
      },
    });

    return NextResponse.json({ organization: updatedOrganization });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Update portal settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

