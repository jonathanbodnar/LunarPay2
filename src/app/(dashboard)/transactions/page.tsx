'use client';

import { useEffect, useState } from 'react';
import { CreditCard, DollarSign, RefreshCw, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Transaction {
  id: string;
  totalAmount: number;
  fee: number;
  status: string;
  source: string;
  givingSource: string;
  date: string;
  donor: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // TODO: Fetch transactions from API
    setLoading(false);
  }, [filter]);

  const getStatusIcon = (status: string) => {
    if (status === 'P') return <DollarSign className="h-4 w-4 text-green-600" />;
    if (status === 'N') return <AlertCircle className="h-4 w-4 text-red-600" />;
    if (status === 'R') return <RefreshCw className="h-4 w-4 text-orange-600" />;
    return <CreditCard className="h-4 w-4 text-gray-400" />;
  };

  const getStatusText = (status: string) => {
    if (status === 'P') return 'Success';
    if (status === 'N') return 'Failed';
    if (status === 'R') return 'Refunded';
    return status;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      P: 'bg-green-100 text-green-800',
      N: 'bg-red-100 text-red-800',
      R: 'bg-orange-100 text-orange-800',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {getStatusText(status)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="mt-2 text-gray-600">View and manage all transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setFilter('all')}>
            All
          </Button>
          <Button variant="outline" onClick={() => setFilter('success')}>
            Success
          </Button>
          <Button variant="outline" onClick={() => setFilter('failed')}>
            Failed
          </Button>
          <Button variant="outline">
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Successful</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">0</div>
            <p className="text-xs text-gray-500 mt-1">Transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Failed</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">0</div>
            <p className="text-xs text-gray-500 mt-1">Transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Refunded</CardTitle>
            <RefreshCw className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">0</div>
            <p className="text-xs text-gray-500 mt-1">Transactions</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : transactions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
            <p className="text-gray-500 text-center mb-6">
              Transactions will appear here once customers make payments
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(transaction.status)}
                    <div>
                      <p className="font-medium">
                        {transaction.donor.firstName} {transaction.donor.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{transaction.givingSource}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(Number(transaction.totalAmount))}</p>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(transaction.status)}
                      <span className="text-xs text-gray-500">
                        {transaction.source === 'CC' ? 'Card' : 'Bank'}
                      </span>
                    </div>
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
