import { NextResponse } from 'next/server';
import {
  verifySuperAdminCredentials,
  generateAdminToken,
  ADMIN_COOKIE_NAME,
} from '@/lib/admin-auth';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24, // 24 hours
  path: '/',
};

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const isValid = await verifySuperAdminCredentials(email, password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = generateAdminToken(email);
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
    });
    response.cookies.set(ADMIN_COOKIE_NAME, token, COOKIE_OPTIONS);
    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}

