import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Available permissions for team members
// These IDs must match what's used in the sidebar and permissions.ts
export const AVAILABLE_PERMISSIONS = [
  { id: 'view_transactions', name: 'View Transactions', description: 'View transactions and payment history' },
  { id: 'create_transactions', name: 'Create Transactions', description: 'Process new payments' },
  { id: 'refund_transactions', name: 'Refund Transactions', description: 'Process refunds' },
  { id: 'view_customers', name: 'View Customers', description: 'View customer list and details' },
  { id: 'manage_customers', name: 'Manage Customers', description: 'Create and edit customers' },
  { id: 'view_invoices', name: 'View Invoices', description: 'View invoices and payment links' },
  { id: 'manage_invoices', name: 'Manage Invoices', description: 'Create and manage invoices' },
  { id: 'view_products', name: 'View Products', description: 'View product catalog' },
  { id: 'manage_products', name: 'Manage Products', description: 'Create and edit products' },
  { id: 'view_reports', name: 'View Reports', description: 'Access reports and analytics' },
  { id: 'manage_team', name: 'Manage Team', description: 'Invite and manage team members' },
  { id: 'manage_settings', name: 'Manage Settings', description: 'Access organization settings' },
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

    // Get pending invites (use raw SQL for reliability)
    const pendingInvites = await prisma.$queryRaw<Array<{
      id: number;
      email: string;
      role: string;
      permissions: string | null;
      status: string;
      expires_at: Date;
      created_at: Date;
    }>>`
      SELECT id, email, role, permissions, status, expires_at, created_at 
      FROM team_invites 
      WHERE organization_id = ANY(${orgIds}) 
      AND status = 'pending' 
      AND expires_at > NOW()
      ORDER BY created_at DESC
    `;

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
      createdAt: inv.created_at,
      expiresAt: inv.expires_at,
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
