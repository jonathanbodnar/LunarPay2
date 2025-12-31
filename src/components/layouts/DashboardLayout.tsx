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
  ChevronDown
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { name: string; href: string }[];
}

const navigation: NavItem[] = [
  { name: 'Organizations', href: '/organizations', icon: Building2 },
  { 
    name: 'Payments', 
    href: '/invoices', 
    icon: CreditCard,
    children: [
      { name: 'Invoices', href: '/invoices' },
      { name: 'Payment Links', href: '/payment-links' },
      { name: 'Transactions', href: '/transactions' },
      { name: 'Recurring', href: '/subscriptions' },
      { name: 'Payouts', href: '/funds' },
    ]
  },
  { name: 'Customers', href: '/customers', icon: Users },
  { 
    name: 'Products', 
    href: '/products', 
    icon: Package,
  },
  { 
    name: 'Settings', 
    href: '/settings', 
    icon: Settings,
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['Payments']);

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
            <div className="flex h-16 items-center justify-between px-6 border-b border-border">
              <Link href="/dashboard" className="flex items-center gap-2">
                <img 
                  src="/logo-dark.svg" 
                  alt="LunarPay" 
                  className="h-7 w-auto"
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
              {navigation.map((item) => (
                <NavLink key={item.name} item={item} mobile />
              ))}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
              <button
                onClick={() => {}}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-all"
              >
                <HelpCircle className="h-[18px] w-[18px]" />
                <span>Help Desk</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-[260px] lg:flex-col">
        <div className="flex flex-col flex-grow bg-background border-r border-border">
          <div className="flex h-16 items-center px-6 border-b border-border">
            <Link href="/dashboard" className="flex items-center gap-2">
              <img 
                src="/logo-dark.svg" 
                alt="LunarPay" 
                className="h-7 w-auto"
              />
            </Link>
          </div>
          <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
            {navigation.map((item) => (
              <NavLink key={item.name} item={item} />
            ))}
          </nav>
          <div className="p-4 border-t border-border">
            <button
              onClick={() => {}}
              className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-all"
            >
              <HelpCircle className="h-[18px] w-[18px]" />
              <span>Help Desk</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-[260px]">
        {/* Top header */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg hover:bg-muted"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            {/* Organization selector placeholder */}
            <div className="hidden sm:block">
              <span className="text-sm font-medium">Apollo Eleven Inc</span>
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
        <footer className="border-t border-border py-6 px-4 lg:px-8">
          <div className="text-center text-sm text-muted-foreground">
            @ LunarPay
          </div>
        </footer>
      </div>
    </div>
  );
}
