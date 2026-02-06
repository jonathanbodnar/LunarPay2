import { NextResponse } from 'next/server';
import { requireAuth, generateRandomToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';

function generateSecurePassword(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const randomBytes = crypto.randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(randomBytes[i] % chars.length);
  }
  return password;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireAuth();
    const memberId = parseInt(id);

    // Verify member belongs to current user's team
    const member = await prisma.user.findFirst({
      where: {
        id: memberId,
        parentId: currentUser.userId,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    // Generate a secure password reset token
    const resetToken = generateRandomToken(32);
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with reset token
    await prisma.user.update({
      where: { id: memberId },
      data: { 
        resetToken,
        resetTokenExpiry,
      },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

    // Send email with reset link (never send plain-text passwords)
    const emailHTML = `
      <h2>Set Up Your LunarPay Account</h2>
      <p>Hello ${member.firstName},</p>
      <p>You've been invited to join a team on LunarPay. Click the link below to set up your password:</p>
      <p><a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px;">Set Up Password</a></p>
      <p>This link will expire in 24 hours.</p>
      <p>Your email: <strong>${member.email}</strong></p>
      <p>If you didn't expect this invitation, you can safely ignore this email.</p>
    `;

    await sendEmail({
      to: member.email,
      subject: 'Set up your LunarPay account',
      html: emailHTML,
    });

    return NextResponse.json({
      success: true,
      message: 'Invitation resent successfully',
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Resend invitation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

