import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import bcrypt from 'bcryptjs';

function generatePassword(length: number = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await requireAuth();
    const memberId = parseInt(params.id);

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

    // Generate new password
    const newPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: memberId },
      data: { password: hashedPassword },
    });

    // Send email with new credentials
    const emailHTML = `
      <h2>Your credentials have been reset</h2>
      <p>Hello ${member.firstName},</p>
      <p>Your login credentials have been reset:</p>
      <p><strong>Email:</strong> ${member.email}<br>
      <strong>Password:</strong> ${newPassword}</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/login">Click here to login</a></p>
      <p>Please change your password after logging in.</p>
    `;

    await sendEmail({
      to: member.email,
      subject: 'Your credentials have been reset - LunarPay',
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

