import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { generateToken } from '@/lib/auth';

// POST /api/admin/merchants/[id]/login-as - Impersonate a merchant's owner account
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const organizationId = parseInt(id);

    if (isNaN(organizationId)) {
      return NextResponse.json({ error: 'Invalid organization ID' }, { status: 400 });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        userId: true,
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    const token = generateToken(
      { userId: organization.user.id, email: organization.user.email },
      '2h'
    );

    console.log(
      `[ADMIN] Impersonating user ${organization.user.id} (${organization.user.email}) for org ${organization.name}`
    );

    const response = NextResponse.json({ success: true, token });

    response.cookies.set('lunarpay_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 2, // 2 hours
      path: '/',
    });

    return response;
  } catch (error) {
    if ((error as Error).message === 'AdminUnauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[ADMIN] Login-as error:', error);
    return NextResponse.json({ error: 'Failed to impersonate merchant' }, { status: 500 });
  }
}
