'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Building2, 
  FileText, 
  Link as LinkIcon, 
  Users, 
  CreditCard,
  Repeat,
  Wallet,
  Package,
  Settings,
  LogOut,
  Menu,
  X,
  HelpCircle,
  ChevronDown,
  Rocket,
  Ticket,
  Shield
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { name: string; href: string; permission?: string }[];
  permission?: string; // Required permission to see this item
}

interface UserPermissions {
  role: string;
  permissions: string[];
  isOwner: boolean;
}

// Map nav items to required permissions
const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Organizations', href: '/organizations', icon: Building2, permission: 'manage_settings' },
  { 
    name: 'Payments', 
    href: '/invoices', 
    icon: CreditCard,
    permission: 'view_invoices',
    children: [
      { name: 'Invoices', href: '/invoices', permission: 'view_invoices' },
      { name: 'Payment Links', href: '/payment-links', permission: 'view_invoices' },
      { name: 'Transactions', href: '/transactions', permission: 'view_transactions' },
      { name: 'Subscriptions', href: '/subscriptions', permission: 'view_transactions' },
      { name: 'Payouts', href: '/payouts', permission: 'view_transactions' },
    ]
  },
  { name: 'Customers', href: '/customers', icon: Users, permission: 'view_customers' },
  { 
    name: 'Products', 
    href: '/products', 
    icon: Package,
    permission: 'view_products',
  },
  { 
    name: 'Settings', 
    href: '/settings', 
    icon: Settings,
    permission: 'manage_settings',
    children: [
      { name: 'Customer Portal', href: '/settings/customer-portal', permission: 'manage_settings' },
      { name: 'Branding', href: '/settings/branding', permission: 'manage_settings' },
      { name: 'Email Templates', href: '/settings/email-templates', permission: 'manage_settings' },
      { name: 'Integrations', href: '/settings/integrations', permission: 'manage_settings' },
      { name: 'Team', href: '/settings/team', permission: 'manage_team' },
      { name: 'Notifications', href: '/settings/notifications', permission: 'manage_settings' },
    ]
  },
  { 
    name: 'Admin', 
    href: '/admin/tickets', 
    icon: Shield,
    permission: 'manage_settings', // Only owners/admins see this
    children: [
      { name: 'Support Tickets', href: '/admin/tickets', permission: 'manage_settings' },
    ]
  },
];

// Helper to check if user has permission
function hasPermission(userPerms: UserPermissions | null, requiredPerm?: string): boolean {
  // If no permission required, allow access
  if (!requiredPerm) return true;
  
  // If user is owner, they have all permissions
  if (userPerms?.isOwner) return true;
  
  // Check if user has the specific permission
  return userPerms?.permissions?.includes(requiredPerm) || false;
}

// Filter navigation based on permissions
function getFilteredNavigation(userPerms: UserPermissions | null): NavItem[] {
  return navigation
    .filter(item => hasPermission(userPerms, item.permission))
    .map(item => ({
      ...item,
      children: item.children?.filter(child => hasPermission(userPerms, child.permission)),
    }));
}

interface SetupProgress {
  completed: number;
  total: number;
  isComplete: boolean;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['Payments']);
  const [setupProgress, setSetupProgress] = useState<SetupProgress | null>(null);
  const [organizationName, setOrganizationName] = useState<string>('');
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  const [filteredNav, setFilteredNav] = useState<NavItem[]>(navigation);

  useEffect(() => {
    fetchUserPermissions();
    checkSetupProgress();
  }, []);

  const fetchUserPermissions = async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const perms: UserPermissions = {
          role: data.user.role,
          permissions: data.user.permissions || [],
          isOwner: data.user.isOwner,
        };
        setUserPermissions(perms);
        setFilteredNav(getFilteredNavigation(perms));
      }
    } catch (error) {
      console.error('Failed to fetch user permissions:', error);
    }
  };

  const checkSetupProgress = async () => {
    try {
      // Add small delay to ensure auth cookie is properly set after login redirect
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const [orgsRes, customersRes, productsRes, invoicesRes] = await Promise.all([
        fetch('/api/organizations', { credentials: 'include' }).catch(() => null),
        fetch('/api/customers', { credentials: 'include' }).catch(() => null),
        fetch('/api/products', { credentials: 'include' }).catch(() => null),
        fetch('/api/invoices', { credentials: 'include' }).catch(() => null),
      ]);

      // If any request failed completely or returned 401, don't show the banner
      if (!orgsRes || !orgsRes.ok) {
        console.log('[SetupProgress] API calls failed or unauthorized, skipping banner');
        return;
      }

      const [orgs, customers, products, invoices] = await Promise.all([
        orgsRes?.ok ? orgsRes.json().catch(() => ({ organizations: [] })) : { organizations: [] },
        customersRes?.ok ? customersRes.json().catch(() => ({ customers: [] })) : { customers: [] },
        productsRes?.ok ? productsRes.json().catch(() => ({ products: [] })) : { products: [] },
        invoicesRes?.ok ? invoicesRes.json().catch(() => ({ invoices: [] })) : { invoices: [] },
      ]);

      // Set organization name from first org
      if (orgs.organizations?.length > 0) {
        setOrganizationName(orgs.organizations[0].name || '');
      }

      const steps = [
        orgs.organizations?.length > 0,
        customers.customers?.length > 0,
        products.products?.length > 0,
        invoices.invoices?.length > 0,
        false, // Branding - TODO: check if set
        orgs.organizations?.[0]?.fortisOnboarding?.appStatus === 'ACTIVE',
      ];

      const completed = steps.filter(Boolean).length;
      setSetupProgress({
        completed,
        total: steps.length,
        isComplete: completed === steps.length,
      });
    } catch (error) {
      console.error('Failed to check setup progress:', error);
      // Don't break the layout if setup check fails
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('lunarpay_token');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleExpanded = (name: string) => {
    setExpandedItems(prev => 
      prev.includes(name) 
        ? prev.filter(item => item !== name)
        : [...prev, name]
    );
  };

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + '/');
  };

  const NavLink = ({ item, mobile = false }: { item: NavItem; mobile?: boolean }) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.name);
    const itemActive = isActive(item.href) || item.children?.some(child => isActive(child.href));

    if (hasChildren) {
      return (
        <div>
          <button
            onClick={() => toggleExpanded(item.name)}
            className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
              itemActive
                ? 'bg-black text-white'
                : 'text-foreground/70 hover:bg-muted hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon className="h-[18px] w-[18px]" />
              <span>{item.name}</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
          {isExpanded && (
            <div className="mt-1 ml-6 space-y-1 border-l border-border pl-3">
              {item.children?.map((child) => (
                <Link
                  key={child.name}
                  href={child.href}
                  className={`block px-3 py-2 text-sm rounded-lg transition-all ${
                    isActive(child.href)
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => mobile && setSidebarOpen(false)}
                >
                  {child.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        href={item.href}
        className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
          itemActive
            ? 'bg-black text-white'
            : 'text-foreground/70 hover:bg-muted hover:text-foreground'
        }`}
        onClick={() => mobile && setSidebarOpen(false)}
      >
        <item.icon className="h-[18px] w-[18px]" />
        <span>{item.name}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm" 
            onClick={() => setSidebarOpen(false)} 
          />
          <div className="fixed inset-y-0 left-0 w-[280px] bg-background shadow-soft">
            <div className="flex h-16 items-center justify-between px-6">
              <Link href="/dashboard" className="flex items-center gap-2">
                <img 
                  src="/logo.png" 
                  alt="LunarPay" 
                  className="h-8 w-auto"
                />
              </Link>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 px-4 py-6">
              {filteredNav.map((item) => (
                <NavLink key={item.name} item={item} mobile />
              ))}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <Link
                href="/help-desk"
                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-all"
                onClick={() => setSidebarOpen(false)}
              >
                <HelpCircle className="h-[18px] w-[18px]" />
                <span>Help Desk</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-[260px] lg:flex-col">
        <div className="flex flex-col flex-grow bg-background">
          <div className="flex h-16 items-center px-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <img 
                src="/logo.png" 
                alt="LunarPay" 
                className="h-8 w-auto"
              />
            </Link>
          </div>
          <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
            {filteredNav.map((item) => (
              <NavLink key={item.name} item={item} />
            ))}
          </nav>
          <div className="p-4">
            <Link
              href="/help-desk"
              className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-all"
            >
              <HelpCircle className="h-[18px] w-[18px]" />
              <span>Help Desk</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-[260px]">
        {/* Top header */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-background px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg hover:bg-muted"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            {/* Organization name with setup badge */}
            <div className="hidden sm:flex items-center gap-3">
              {organizationName && (
                <span className="text-sm font-medium">{organizationName}</span>
              )}
              {/* Setup Progress Badge */}
              {setupProgress && !setupProgress.isComplete && pathname !== '/getting-started' && (
                <Link
                  href="/getting-started"
                  className="flex items-center gap-2 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-full text-xs font-medium text-blue-700 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <Rocket className="h-3 w-3" />
                    <span>{setupProgress.completed}/{setupProgress.total}</span>
                  </div>
                  <div className="w-12 h-1.5 bg-blue-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${(setupProgress.completed / setupProgress.total) * 100}%` }}
                    />
                  </div>
                </Link>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>

        <main className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="py-6 px-4 lg:px-8">
        </footer>
      </div>
    </div>
  );
}
