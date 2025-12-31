import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Available permissions for team members
export const AVAILABLE_PERMISSIONS = [
  { id: 'dashboard', name: 'Dashboard', description: 'View dashboard overview' },
  { id: 'invoices', name: 'Invoices', description: 'Create and manage invoices' },
  { id: 'payment_links', name: 'Payment Links', description: 'Create and manage payment links' },
  { id: 'transactions', name: 'Transactions', description: 'View transactions' },
  { id: 'subscriptions', name: 'Subscriptions', description: 'Manage subscriptions' },
  { id: 'customers', name: 'Customers', description: 'View and manage customers' },
  { id: 'products', name: 'Products', description: 'Manage products' },
  { id: 'payouts', name: 'Payouts', description: 'View payouts' },
] as const;

// GET /api/team - List team members and pending invites
export async function GET() {
  try {
    const currentUser = await requireAuth();

    // Get user info from database
    const userInfo = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { firstName: true, lastName: true, email: true },
    });

    // Get user's organizations
    const organizations = await prisma.organization.findMany({
      where: { userId: currentUser.userId },
      select: { id: true, name: true },
    });

    if (organizations.length === 0) {
      return NextResponse.json({ members: [], invites: [] });
    }

    const orgIds = organizations.map(o => o.id);

    // Get team members
    const teamMembers = await prisma.$queryRaw<Array<{
      id: number;
      user_id: number;
      organization_id: number;
      role: string;
      permissions: string | null;
      joined_at: Date;
      email: string;
      first_name: string | null;
      last_name: string | null;
    }>>`
      SELECT tm.*, u.email, u.first_name, u.last_name
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.organization_id = ANY(${orgIds})
      ORDER BY tm.joined_at ASC
    `;

    // Get pending invites
    const pendingInvites = await prisma.teamInvite.findMany({
      where: {
        organizationId: { in: orgIds },
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Add the owner (current user)
    const members = [
      {
        id: 0,
        name: `${userInfo?.firstName || ''} ${userInfo?.lastName || ''}`.trim() || 'Account Owner',
        email: userInfo?.email || currentUser.email,
        role: 'owner',
        permissions: null,
        status: 'active',
        joinedAt: null,
      },
      ...teamMembers.map(tm => ({
        id: tm.id,
        name: `${tm.first_name || ''} ${tm.last_name || ''}`.trim() || tm.email,
        email: tm.email,
        role: tm.role,
        permissions: tm.permissions ? JSON.parse(tm.permissions) : null,
        status: 'active',
        joinedAt: tm.joined_at,
      })),
    ];

    const invites = pendingInvites.map(inv => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      permissions: inv.permissions ? JSON.parse(inv.permissions) : null,
      status: 'pending',
      createdAt: inv.createdAt,
      expiresAt: inv.expiresAt,
    }));

    return NextResponse.json({ 
      members, 
      invites,
      availablePermissions: AVAILABLE_PERMISSIONS,
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Get team error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
