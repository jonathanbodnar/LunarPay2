import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

// POST /api/portal/auth/logout - Logout customer from portal
export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('portal_session')?.value;

    if (sessionToken) {
      // Delete the session from database
      await prisma.customerSession.deleteMany({
        where: { token: sessionToken },
      });
    }

    // Clear the cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set('portal_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}

