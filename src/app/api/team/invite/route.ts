import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateRandomToken } from '@/lib/utils';
import { sendTeamInviteEmail } from '@/lib/email';
import { z } from 'zod';

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member']),
  permissions: z.array(z.string()).optional(),
});

// POST /api/team/invite - Send team invitation
export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();

    const validation = inviteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { email, role, permissions } = validation.data;

    // Get user info and organization
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { firstName: true, lastName: true },
    });

    const organization = await prisma.organization.findFirst({
      where: { userId: currentUser.userId },
      select: { id: true, name: true },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 404 }
      );
    }

    // Check if user is already a team member
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const existingMember = await prisma.$queryRaw<Array<{ id: number }>>`
        SELECT id FROM team_members 
        WHERE user_id = ${existingUser.id} AND organization_id = ${organization.id}
      `;
      
      if (existingMember.length > 0) {
        return NextResponse.json(
          { error: 'This user is already a team member' },
          { status: 400 }
        );
      }
    }

    // Check for existing pending invite (use raw SQL for reliability)
    const existingInvites = await prisma.$queryRaw<Array<{ id: number }>>`
      SELECT id FROM team_invites 
      WHERE email = ${email} 
      AND organization_id = ${organization.id} 
      AND status = 'pending' 
      AND expires_at > NOW()
    `;

    if (existingInvites.length > 0) {
      return NextResponse.json(
        { error: 'An invitation has already been sent to this email' },
        { status: 400 }
      );
    }

    // Delete any old/cancelled invites for this email to avoid duplicates
    await prisma.$executeRaw`
      DELETE FROM team_invites 
      WHERE email = ${email} AND organization_id = ${organization.id}
    `;

    // Create invite token
    const token = generateRandomToken(48);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Create the invitation (use raw SQL)
    await prisma.$executeRaw`
      INSERT INTO team_invites (organization_id, invited_by, email, role, permissions, token, status, expires_at, created_at)
      VALUES (${organization.id}, ${currentUser.userId}, ${email}, ${role}, ${permissions && permissions.length > 0 ? JSON.stringify(permissions) : null}, ${token}, 'pending', ${expiresAt}, NOW())
    `;

    // Get the created invite
    const inviteResult = await prisma.$queryRaw<Array<{ id: number; email: string; role: string; status: string; expires_at: Date }>>`
      SELECT id, email, role, status, expires_at FROM team_invites WHERE token = ${token}
    `;
    const invite = inviteResult[0];

    // Send invitation email
    const inviterName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'A team member';
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.lunarpay.com'}/invite/${token}`;
    
    await sendTeamInviteEmail({
      to: email,
      inviterName,
      organizationName: organization.name,
      role,
      inviteUrl,
    });

    return NextResponse.json({
      success: true,
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        status: invite.status,
        expiresAt: invite.expires_at,
      },
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Send invite error:', error);
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 });
  }
}

// DELETE /api/team/invite - Cancel/revoke an invitation
export async function DELETE(request: Request) {
  try {
    const currentUser = await requireAuth();
    const { searchParams } = new URL(request.url);
    const inviteId = searchParams.get('id');

    if (!inviteId) {
      return NextResponse.json({ error: 'Invite ID required' }, { status: 400 });
    }

    // Get user's organization
    const organization = await prisma.organization.findFirst({
      where: { userId: currentUser.userId },
      select: { id: true },
    });

    if (!organization) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Delete the invite (use raw SQL for reliability)
    await prisma.$executeRaw`
      DELETE FROM team_invites 
      WHERE id = ${parseInt(inviteId)} AND organization_id = ${organization.id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Delete invite error:', error);
    return NextResponse.json({ error: 'Failed to cancel invitation' }, { status: 500 });
  }
}

