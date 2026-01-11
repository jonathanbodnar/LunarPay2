import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Map old permission IDs to new ones for backward compatibility
const PERMISSION_MIGRATION_MAP: Record<string, string[]> = {
  'dashboard': ['view_transactions', 'view_customers', 'view_invoices', 'view_products'],
  'invoices': ['view_invoices', 'manage_invoices'],
  'payment_links': ['view_invoices', 'manage_invoices'],
  'transactions': ['view_transactions'],
  'subscriptions': ['view_transactions'],
  'customers': ['view_customers', 'manage_customers'],
  'products': ['view_products', 'manage_products'],
  'payouts': ['view_transactions'],
};

// Convert old permission format to new
function migratePermissions(permissions: string[]): string[] {
  const migrated = new Set<string>();
  
  for (const perm of permissions) {
    // If it's an old permission, map it to new ones
    if (PERMISSION_MIGRATION_MAP[perm]) {
      PERMISSION_MIGRATION_MAP[perm].forEach(newPerm => migrated.add(newPerm));
    } else {
      // It's already a new permission or unknown, keep it
      migrated.add(perm);
    }
  }
  
  return Array.from(migrated);
}

// GET /api/auth/me - Get current user info including permissions
export async function GET() {
  try {
    const currentUser = await requireAuth();

    // Get full user details including role and permissions
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        permissions: true,
        parentId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get team memberships with their permissions
    const teamMemberships = await prisma.$queryRaw<Array<{
      id: number;
      organization_id: number;
      role: string;
      permissions: string | null;
      organization_name: string;
    }>>`
      SELECT tm.id, tm.organization_id, tm.role, tm.permissions, cd.company_name as organization_name
      FROM team_members tm
      JOIN church_detail cd ON tm.organization_id = cd.id
      WHERE tm.user_id = ${user.id}
    `;

    // Determine effective permissions
    // If user is owner (has their own organizations), they're admin
    const ownedOrgs = await prisma.organization.findMany({
      where: { userId: user.id },
      select: { id: true, name: true },
    });

    const isOwner = ownedOrgs.length > 0;
    
    // Parse permissions from user record or team membership
    let effectivePermissions: string[] = [];
    let effectiveRole = user.role || 'viewer';

    if (isOwner) {
      // Owner gets all permissions
      effectiveRole = 'admin';
      effectivePermissions = [
        'view_transactions',
        'create_transactions',
        'refund_transactions',
        'view_customers',
        'manage_customers',
        'view_invoices',
        'manage_invoices',
        'view_products',
        'manage_products',
        'view_reports',
        'manage_team',
        'manage_settings',
      ];
    } else if (teamMemberships.length > 0) {
      // Use team membership permissions
      const membership = teamMemberships[0]; // Primary membership
      effectiveRole = membership.role || 'member';
      
      if (membership.permissions) {
        try {
          const rawPermissions = JSON.parse(membership.permissions);
          // Migrate old permission format to new
          effectivePermissions = migratePermissions(rawPermissions);
        } catch {
          effectivePermissions = [];
        }
      }
      
      // If no custom permissions set, use role-based defaults
      if (effectivePermissions.length === 0) {
        if (membership.role === 'admin') {
          effectivePermissions = [
            'view_transactions',
            'create_transactions',
            'refund_transactions',
            'view_customers',
            'manage_customers',
            'view_invoices',
            'manage_invoices',
            'view_products',
            'manage_products',
            'view_reports',
            'manage_team',
            'manage_settings',
          ];
        } else {
          // Default member permissions - basic view access
          effectivePermissions = [
            'view_transactions',
            'view_customers',
            'view_invoices',
            'view_products',
          ];
        }
      }
    } else if (user.permissions) {
      // Use user-level permissions
      try {
        const rawPermissions = JSON.parse(user.permissions);
        effectivePermissions = migratePermissions(rawPermissions);
      } catch {
        const rawPermissions = user.permissions.split(',').map(p => p.trim());
        effectivePermissions = migratePermissions(rawPermissions);
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: effectiveRole,
        permissions: effectivePermissions,
        isOwner,
        teamMemberships: teamMemberships.map(tm => ({
          organizationId: tm.organization_id,
          organizationName: tm.organization_name,
          role: tm.role,
        })),
        ownedOrganizations: ownedOrgs,
      },
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Get current user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
