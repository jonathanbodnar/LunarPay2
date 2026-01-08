import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/portal/:slug - Get portal info by slug (public)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const organization = await prisma.organization.findFirst({
      where: {
        OR: [
          { portalSlug: slug },
          { slug: slug },
        ],
        portalEnabled: true,
      },
      select: {
        id: true,
        name: true,
        logo: true,
        // primaryColor: true, // Column doesn't exist in database
        // backgroundColor: true, // Column doesn't exist in database
        // buttonTextColor: true, // Column doesn't exist in database
        portalTitle: true,
        portalDescription: true,
        portalSlug: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Portal not found or not enabled' },
        { status: 404 }
      );
    }

    return NextResponse.json({ organization });
  } catch (error) {
    console.error('Get portal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

