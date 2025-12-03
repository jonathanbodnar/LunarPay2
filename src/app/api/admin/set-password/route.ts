import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

// TEMPORARY ADMIN ENDPOINT - DELETE AFTER USE!
// This endpoint allows setting password without authentication
// ONLY use in development/initial setup then DELETE THIS FILE!

export async function POST(request: Request) {
  try {
    const { email, password, adminSecret } = await request.json();

    // Require a secret to prevent abuse
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Hash the new password
    const hashedPassword = await hashPassword(password);

    // Update user
    const user = await prisma.user.update({
      where: { email },
      data: { 
        password: hashedPassword,
        role: 'admin',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Password updated for ${user.email}`,
      email: user.email,
    });
  } catch (error) {
    console.error('Set password error:', error);
    return NextResponse.json(
      { error: 'Failed to update password', message: (error as Error).message },
      { status: 500 }
    );
  }
}

