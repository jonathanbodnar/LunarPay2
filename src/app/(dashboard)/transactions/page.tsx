'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Search, Download, RefreshCw } from 'lucide-react';

interface Transaction {
  id: number;
  amount: number;
  fee: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  donor: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
  organization: {
    name: string;
  };
}

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    paymentMethod: '',
    search: '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
      if (filters.search) params.append('search', filters.search);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);

      const response = await fetch(`/api/transactions?${params.toString()}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setLoading(true);
    fetchTransactions();
  };

  const handleExport = async () => {
    // TODO: Implement CSV export
    alert('CSV export coming soon!');
  };

  const handleRefund = async (transactionId: number) => {
    if (!confirm('Are you sure you want to refund this transaction?')) return;

    try {
      const response = await fetch(`/api/transactions/${transactionId}/refund`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        alert('Transaction refunded successfully');
        fetchTransactions();
      } else {
        alert('Failed to refund transaction');
      }
    } catch (error) {
      alert('Error refunding transaction');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      succeeded: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || styles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="mt-2 text-gray-600">View and manage all transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={fetchTransactions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Customer name or email..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select
                className="w-full h-10 px-3 rounded-md border border-gray-300"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Statuses</option>
                <option value="succeeded">Succeeded</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Method</label>
              <select
                className="w-full h-10 px-3 rounded-md border border-gray-300"
                value={filters.paymentMethod}
                onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
              >
                <option value="">All Methods</option>
                <option value="card">Credit Card</option>
                <option value="ach">ACH/Bank</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date From</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date To</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-4">
            <Button onClick={handleSearch}>Apply Filters</Button>
          </div>
        </CardContent>
      </Card>

      {transactions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-500 text-center">
              No transactions found matching your filters
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Transactions ({transactions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/transactions/${transaction.id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium">
                        {transaction.donor.firstName} {transaction.donor.lastName}
                      </span>
                      {getStatusBadge(transaction.status)}
                      <span className="text-sm text-gray-500">
                        {transaction.paymentMethod === 'card' ? '💳 Card' : '🏦 ACH'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {transaction.donor.email} • {transaction.organization.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(transaction.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">
                      {formatCurrency(Number(transaction.amount))}
                    </p>
                    <p className="text-xs text-gray-500">
                      Fee: {formatCurrency(Number(transaction.fee))}
                    </p>
                    {transaction.status === 'succeeded' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRefund(transaction.id);
                        }}
                      >
                        Refund
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
