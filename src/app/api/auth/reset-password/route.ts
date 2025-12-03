import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password } = resetPasswordSchema.parse(body);

    console.log('Password reset attempt with token');

    // Find all users and check their reset tokens (stored in permissions field)
    const users = await prisma.user.findMany({
      where: {
        permissions: {
          contains: token,
        },
      },
    });

    if (users.length === 0) {
      console.error('No user found with this reset token');
      return NextResponse.json(
        { error: 'Invalid or expired reset token. Please request a new password reset.' },
        { status: 400 }
      );
    }

    const user = users[0];

    // Verify token hasn't expired
    try {
      const permData = JSON.parse(user.permissions || '{}');
      if (permData.resetToken !== token) {
        throw new Error('Token mismatch');
      }
      
      const expiry = new Date(permData.resetTokenExpiry);
      if (expiry < new Date()) {
        console.error('Reset token expired');
        return NextResponse.json(
          { error: 'Reset token has expired. Please request a new password reset.' },
          { status: 400 }
        );
      }
    } catch (parseError) {
      console.error('Invalid token format');
      return NextResponse.json(
        { error: 'Invalid reset token format.' },
        { status: 400 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        permissions: null, // Clear the reset token
      },
    });

    console.log('Password reset successful for user:', user.id);

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}

