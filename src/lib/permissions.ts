// Role-based permissions system

export type Role = 'admin' | 'manager' | 'staff' | 'viewer';

export type Permission =
  | 'view_transactions'
  | 'create_transactions'
  | 'refund_transactions'
  | 'view_customers'
  | 'manage_customers'
  | 'view_invoices'
  | 'manage_invoices'
  | 'view_products'
  | 'manage_products'
  | 'view_reports'
  | 'manage_team'
  | 'manage_settings';

// Default permissions for each role
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
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
  ],
  manager: [
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
  ],
  staff: [
    'view_transactions',
    'create_transactions',
    'view_customers',
    'manage_customers',
    'view_invoices',
    'manage_invoices',
    'view_products',
  ],
  viewer: [
    'view_transactions',
    'view_customers',
    'view_invoices',
    'view_products',
    'view_reports',
  ],
};

export function hasPermission(
  userRole: Role,
  userPermissions: string[] | null,
  requiredPermission: Permission
): boolean {
  // Get default role permissions
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  
  // Get custom permissions
  const customPermissions = userPermissions || [];
  
  // Check if user has the permission
  return rolePermissions.includes(requiredPermission) || 
         customPermissions.includes(requiredPermission);
}

export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

export function canAccessResource(
  userRole: Role,
  userPermissions: string[] | null,
  resource: 'transactions' | 'customers' | 'invoices' | 'products' | 'reports' | 'team' | 'settings',
  action: 'view' | 'create' | 'update' | 'delete' = 'view'
): boolean {
  const permissionMap: Record<string, Permission> = {
    'transactions.view': 'view_transactions',
    'transactions.create': 'create_transactions',
    'transactions.delete': 'refund_transactions',
    'customers.view': 'view_customers',
    'customers.create': 'manage_customers',
    'customers.update': 'manage_customers',
    'customers.delete': 'manage_customers',
    'invoices.view': 'view_invoices',
    'invoices.create': 'manage_invoices',
    'invoices.update': 'manage_invoices',
    'invoices.delete': 'manage_invoices',
    'products.view': 'view_products',
    'products.create': 'manage_products',
    'products.update': 'manage_products',
    'products.delete': 'manage_products',
    'reports.view': 'view_reports',
    'team.view': 'manage_team',
    'team.create': 'manage_team',
    'team.update': 'manage_team',
    'team.delete': 'manage_team',
    'settings.view': 'manage_settings',
    'settings.update': 'manage_settings',
  };

  const permissionKey = `${resource}.${action}`;
  const requiredPermission = permissionMap[permissionKey];

  if (!requiredPermission) {
    return false;
  }

  return hasPermission(userRole, userPermissions, requiredPermission);
}

// Middleware helper for API routes
export async function checkPermission(
  userId: number,
  resource: string,
  action: string
): Promise<boolean> {
  const { prisma } = await import('@/lib/prisma');
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      permissions: true,
    },
  });

  if (!user) {
    return false;
  }

  const permissions = user.permissions ? user.permissions.split(',') : [];
  return canAccessResource(
    user.role as Role,
    permissions,
    resource as any,
    action as any
  );
}


