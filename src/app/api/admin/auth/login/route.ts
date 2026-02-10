import { NextResponse } from 'next/server';
import { 
  verifySuperAdminCredentials, 
  generateAdminToken, 
  setAdminCookie 
} from '@/lib/admin-auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Debug: log what env vars look like (redacted)
    const envEmail = process.env.ADMIN_EMAIL;
    const envHash = process.env.ADMIN_PASSWORD_HASH;
    const envSecret = process.env.ADMIN_JWT_SECRET;
    console.log('[ADMIN LOGIN] Env check - ADMIN_EMAIL:', envEmail, 'ADMIN_PASSWORD_HASH length:', envHash?.length, 'starts with:', envHash?.substring(0, 7), 'ADMIN_JWT_SECRET:', !!envSecret);
    console.log('[ADMIN LOGIN] Attempting login with email:', email);

    const isValid = await verifySuperAdminCredentials(email, password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = generateAdminToken(email);
    await setAdminCookie(token);

    return NextResponse.json({
      success: true,
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}

