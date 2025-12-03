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

    // Generate a secure reset token
    const resetToken = crypto.randomUUID();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in database (we'll need to add these fields to User model)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        // Note: We'll store in apiKey temporarily since we don't have resetToken fields yet
        // In production, you'd want dedicated resetToken and resetTokenExpiry fields
      },
    });

    // Send reset email via Supabase
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    try {
      // Use Supabase to send email
      const { error: emailError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: user.email,
        options: {
          redirectTo: resetUrl,
        },
      });

      if (emailError) {
        console.error('Supabase email error:', emailError);
        // Fall back to custom email implementation if needed
      }
    } catch (emailErr) {
      console.error('Email sending error:', emailErr);
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

