import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const createTeamMemberSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['admin', 'manager', 'staff', 'viewer']),
  permissions: z.array(z.string()).optional(),
});

// Generate random password
function generatePassword(length: number = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function GET() {
  try {
    const currentUser = await requireAuth();

    const members = await prisma.user.findMany({
      where: {
        OR: [
          { id: currentUser.userId },
          { parentId: currentUser.userId },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        permissions: true,
        createdAt: true,
        lastLogin: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ members });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Get team members error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();
    const validatedData = createTeamMemberSchema.parse(body);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      );
    }

    // Generate temporary password
    const tempPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create team member
    const member = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        role: validatedData.role,
        permissions: validatedData.permissions?.join(','),
        parentId: currentUser.userId,
      },
    });

    // Send invitation email
    const emailHTML = `
      <h2>You've been invited to join the team!</h2>
      <p>Hello ${validatedData.firstName},</p>
      <p>You have been invited to join the team as a <strong>${validatedData.role}</strong>.</p>
      <p>Your login credentials:</p>
      <p><strong>Email:</strong> ${validatedData.email}<br>
      <strong>Password:</strong> ${tempPassword}</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/login">Click here to login</a></p>
      <p>Please change your password after your first login.</p>
    `;

    await sendEmail({
      to: validatedData.email,
      subject: 'Team Invitation - LunarPay',
      html: emailHTML,
    });

    return NextResponse.json(
      {
        member,
        message: 'Team member added and invitation sent',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Create team member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


