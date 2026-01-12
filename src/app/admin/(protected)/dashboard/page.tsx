'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Building2, 
  Users, 
  Ticket,
  TrendingUp,
  Loader2,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';

interface Stats {
  totalMerchants: number;
  activeMerchants: number;
  pendingApplications: number;
  totalProcessed: number;
  totalCustomers: number;
  openTickets: number;
  recurringRevenue: number;
  totalFees: number;
  recentMerchants: Array<{
    id: number;
    name: string;
    status: string;
    processed: number;
    createdAt: string;
  }>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
        <p className="text-slate-400 mt-1">LunarPay platform statistics and management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Merchants</p>
                <p className="text-2xl font-bold text-white mt-1">{stats?.totalMerchants || 0}</p>
              </div>
              <div className="h-12 w-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 text-sm">
              <span className="text-green-400">{stats?.activeMerchants || 0} active</span>
              <span className="text-slate-600">•</span>
              <span className="text-yellow-400">{stats?.pendingApplications || 0} pending</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Processed</p>
                <p className="text-2xl font-bold text-white mt-1">{formatCurrency(stats?.totalProcessed || 0)}</p>
              </div>
              <div className="h-12 w-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 text-sm text-slate-400">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span>All-time volume</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Customers</p>
                <p className="text-2xl font-bold text-white mt-1">{stats?.totalCustomers || 0}</p>
              </div>
              <div className="h-12 w-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-500" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 text-sm text-slate-400">
              Across all merchants
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Recurring Revenue</p>
                <p className="text-2xl font-bold text-white mt-1">{formatCurrency(stats?.recurringRevenue || 0)}</p>
              </div>
              <div className="h-12 w-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-cyan-500" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 text-sm text-slate-400">
              From active subscriptions
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Open Support Tickets</p>
                <p className="text-2xl font-bold text-white mt-1">{stats?.openTickets || 0}</p>
              </div>
              <div className="h-12 w-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <Ticket className="h-6 w-6 text-orange-500" />
              </div>
            </div>
            <Link 
              href="/admin/tickets" 
              className="flex items-center gap-2 mt-3 text-sm text-blue-400 hover:text-blue-300"
            >
              View all tickets →
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Platform Fees</p>
                <p className="text-2xl font-bold text-white mt-1">{formatCurrency(stats?.totalFees || 0)}</p>
              </div>
              <div className="h-12 w-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 text-sm text-slate-400">
              Total processing fees collected
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Merchants */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Recent Merchants</CardTitle>
            <Link 
              href="/admin/merchants" 
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              View all →
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-700">
            {stats?.recentMerchants && stats.recentMerchants.length > 0 ? (
              stats.recentMerchants.map((merchant) => (
                <div key={merchant.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-slate-700 rounded-lg flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{merchant.name}</p>
                      <p className="text-sm text-slate-400">
                        Joined {new Date(merchant.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-slate-400">Processed</p>
                      <p className="font-medium text-white">{formatCurrency(merchant.processed)}</p>
                    </div>
                    {merchant.status === 'ACTIVE' ? (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                        Active
                      </span>
                    ) : merchant.status === 'PENDING' || merchant.status === 'BANK_INFORMATION_SENT' ? (
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                        Pending
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-slate-500/20 text-slate-400 text-xs rounded-full">
                        {merchant.status}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400">
                No merchants yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

