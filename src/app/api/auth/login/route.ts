import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, generateToken, setAuthCookie } from '@/lib/auth';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = loginSchema.parse(body);

    console.log('[LOGIN] Attempting login for:', validatedData.email);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        phone: true,
        paymentProcessor: true,
        active: true,
        starterStep: true,
      },
    });

    console.log('[LOGIN] User found:', user ? 'Yes' : 'No');

    if (!user) {
      console.log('[LOGIN] User not found');
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.active) {
      console.log('[LOGIN] User inactive');
      return NextResponse.json(
        { error: 'Account is deactivated. Please contact support.' },
        { status: 403 }
      );
    }

    // Verify password
    console.log('[LOGIN] Verifying password...');
    const validPassword = await verifyPassword(validatedData.password, user.password);
    console.log('[LOGIN] Password valid:', validPassword);

    if (!validPassword) {
      console.log('[LOGIN] Password verification failed');
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate JWT token
    const expiresIn = validatedData.remember ? '30d' : '7d';
    const token = generateToken(
      {
        userId: user.id,
        email: user.email,
      },
      expiresIn
    );

    console.log('[LOGIN] Token generated successfully');

    // Get user's organizations
    const organizations = await prisma.organization.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        token: true,
        slug: true,
      },
      orderBy: { id: 'asc' },
    });

    console.log('[LOGIN] Organizations fetched:', organizations.length);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Create response with cookie
    const response = NextResponse.json({
      user: userWithoutPassword,
      organizations,
      token,
    });

    // Set cookie in response
    response.cookies.set('lunarpay_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: validatedData.remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7,
      path: '/',
    });

    console.log('[LOGIN] Login successful for:', user.email);

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

