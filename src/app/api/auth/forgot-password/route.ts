import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    console.log('Password reset requested for:', email);

    // Check if user exists in our database
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success even if user doesn't exist (security best practice)
    // This prevents email enumeration attacks
    if (!user) {
      console.log('User not found, but returning success for security');
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive reset instructions.',
      });
    }

    // Generate a secure reset token and store it
    const resetToken = crypto.randomUUID();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in user record
    await prisma.user.update({
      where: { id: user.id },
      data: {
        // Store in permissions field temporarily (JSON format)
        permissions: JSON.stringify({
          resetToken,
          resetTokenExpiry: resetTokenExpiry.toISOString(),
        }),
      },
    });

    // Send reset email using nodemailer (more reliable than Supabase for password reset)
    const { sendPasswordResetEmail } = await import('@/lib/email');
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://lunarpay2-production.up.railway.app'}/reset-password?token=${resetToken}`;
    
    try {
      await sendPasswordResetEmail(user.email, resetUrl, user.firstName || 'User');
      console.log('Password reset email sent successfully to:', user.email);
    } catch (emailErr) {
      console.error('Email sending error:', emailErr);
      // Don't fail the request - still return success for security
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive reset instructions.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

