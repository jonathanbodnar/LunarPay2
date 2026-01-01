import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { z } from 'zod';

// GET /api/team/invite/[token] - Get invitation details (public)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const invite = await prisma.teamInvite.findUnique({
      where: { token },
    });

    if (!invite) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    if (invite.status !== 'pending') {
      return NextResponse.json(
        { error: 'This invitation has already been used' },
        { status: 400 }
      );
    }

    if (new Date() > invite.expiresAt) {
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 400 }
      );
    }

    // Get organization info
    const organization = await prisma.organization.findUnique({
      where: { id: invite.organizationId },
      select: { name: true, logo: true },
    });

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invite.email },
    });

    return NextResponse.json({
      invite: {
        email: invite.email,
        role: invite.role,
        permissions: invite.permissions ? JSON.parse(invite.permissions) : null,
        organizationName: organization?.name || 'Unknown Organization',
        organizationLogo: organization?.logo,
        expiresAt: invite.expiresAt,
      },
      userExists: !!existingUser,
    });
  } catch (error) {
    console.error('Get invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const acceptInviteSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// POST /api/team/invite/[token] - Accept invitation (create account or join)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();

    const invite = await prisma.teamInvite.findUnique({
      where: { token },
    });

    if (!invite) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    if (invite.status !== 'pending') {
      return NextResponse.json(
        { error: 'This invitation has already been used' },
        { status: 400 }
      );
    }

    if (new Date() > invite.expiresAt) {
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 400 }
      );
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: invite.email },
    });

    if (!user) {
      // New user - validate and create account
      const validation = acceptInviteSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Validation error', details: validation.error.issues },
          { status: 400 }
        );
      }

      const { firstName, lastName, password } = validation.data;
      const hashedPassword = await hashPassword(password);

      user = await prisma.user.create({
        data: {
          email: invite.email,
          firstName,
          lastName,
          password: hashedPassword,
          role: invite.role,
          parentId: invite.invitedBy,
          permissions: invite.permissions,
          active: true,
        },
      });
    }

    // Add user to team
    await prisma.$executeRaw`
      INSERT INTO team_members (user_id, organization_id, role, permissions, invited_by, joined_at)
      VALUES (${user.id}, ${invite.organizationId}, ${invite.role}, ${invite.permissions}, ${invite.invitedBy}, NOW())
      ON CONFLICT (user_id, organization_id) DO NOTHING
    `;

    // Mark invite as accepted
    await prisma.teamInvite.update({
      where: { id: invite.id },
      data: {
        status: 'accepted',
        acceptedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'You have successfully joined the team!',
    });
  } catch (error) {
    console.error('Accept invite error:', error);
    return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
  }
}

