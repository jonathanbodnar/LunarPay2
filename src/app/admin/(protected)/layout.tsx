'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Ticket, 
  Building2, 
  LogOut, 
  Shield,
  Menu,
  X,
  ChevronDown,
  UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Merchants', href: '/admin/merchants', icon: Building2 },
  { name: 'Leads', href: '/admin/leads', icon: UserPlus },
  { name: 'Support Tickets', href: '/admin/tickets', icon: Ticket },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/admin/auth/check', { credentials: 'include' });
      if (!res.ok) {
        router.push('/admin/login');
      }
    } catch {
      router.push('/admin/login');
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST', credentials: 'include' });
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActive = (href: string) => pathname === href;

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={() => setSidebarOpen(false)} 
          />
          <div className="fixed inset-y-0 left-0 w-[280px] bg-slate-800 shadow-xl">
            <div className="flex h-16 items-center justify-between px-6 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Shield className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-white">LunarPay Admin</span>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-700 text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="p-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive(item.href)
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-slate-800 border-r border-slate-700">
          <div className="flex h-16 items-center px-6 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-white">LunarPay Admin</span>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive(item.href)
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-slate-700">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-all"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-slate-800 border-b border-slate-700 px-4 lg:px-8">
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg hover:bg-slate-700 text-slate-400"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="flex-1 lg:flex-none" />
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">Super Admin</span>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white hover:bg-slate-700"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

