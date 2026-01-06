'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Users, FileText, DollarSign, TrendingUp, CreditCard, RefreshCw, AlertCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface RecentTransaction {
  id: number;
  totalAmount: number;
  status: string;
  source: string;
  createdAt: string;
  donor: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
}

interface DashboardStats {
  revenue: {
    total: number;
    monthly: number;
    yearly: number;
    last30Days: number;
  };
  fees: {
    total: number;
    monthly: number;
    yearly: number;
  };
  net: {
    total: number;
    monthly: number;
    yearly: number;
  };
  transactions: {
    total: number;
    monthly: number;
  };
  invoices: {
    pending: number;
  };
  subscriptions: {
    active: number;
  };
  customers: {
    total: number;
    newThisMonth: number;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setError(null);
      const response = await fetch('/api/dashboard/stats', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-6 w-6 border-2 border-foreground border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Dashboard</h3>
              <p className="text-muted-foreground mb-4">{error || 'Unable to load dashboard data'}</p>
              <Button onClick={fetchStats}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-5 w-5" />
          <h1 className="text-xl font-semibold">Dashboard</h1>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStats}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.revenue.total)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All time • Net: {formatCurrency(stats.net.total)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(stats.revenue.monthly)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This month • Net: {formatCurrency(stats.net.monthly)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Transactions
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.transactions.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.transactions.monthly} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Customers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.customers.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +{stats.customers.newThisMonth} this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Invoices
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.invoices.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Subscriptions
            </CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.subscriptions.active}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Recurring payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Processing Fees
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(stats.fees.monthly)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This month • Total: {formatCurrency(stats.fees.total)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest payment activity</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentTransactions />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/invoices/new')}>
              <FileText className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/payment-links/new')}>
              <FileText className="mr-2 h-4 w-4" />
              Create Payment Link
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/customers/new')}>
              <Users className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RecentTransactions() {
  const [transactions, setTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/transactions?limit=5', {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        setTransactions(data.transactions || []);
      })
      .catch((err) => console.error('Failed to fetch recent transactions:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin h-4 w-4 border-2 border-foreground border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8 text-sm">
        No recent transactions
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
          onClick={() => router.push(`/transactions/${tx.id}`)}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">
                {tx.donor.firstName} {tx.donor.lastName}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                tx.status === 'P' ? 'bg-green-100 text-green-800' :
                tx.status === 'N' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {tx.status === 'P' ? 'Success' : tx.status === 'N' ? 'Failed' : 'Pending'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDate(tx.createdAt)} • {tx.source === 'CC' ? 'Card' : 'ACH'}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-sm">
              {formatCurrency(Number(tx.totalAmount))}
            </p>
          </div>
        </div>
      ))}
      <Button
        variant="outline"
        className="w-full mt-2"
        onClick={() => router.push('/transactions')}
      >
        View All Transactions
      </Button>
    </div>
  );
}
