'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { DollarSign, Download, TrendingUp } from 'lucide-react';

interface Payout {
  id: number;
  amount: number;
  fee: number;
  net: number;
  status: string;
  createdAt: string;
  paidAt: string | null;
  transactionCount: number;
  periodStart: string;
  periodEnd: string;
}

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPaidOut: 0,
    pendingPayout: 0,
    nextPayoutDate: null as string | null,
  });
  const [dataSource, setDataSource] = useState<string>('');
  const [fortisEndpoint, setFortisEndpoint] = useState<string>('');

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    try {
      const response = await fetch('/api/payouts', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setPayouts(data.payouts || []);
        setStats(data.stats || stats);
        setDataSource(data.source || 'unknown');
        setFortisEndpoint(data.fortisEndpoint || '');
        
        // Log data source for debugging
        console.log('[Payouts] Data source:', data.source);
        console.log('[Payouts] Fortis endpoint:', data.fortisEndpoint);
        console.log('[Payouts] Response:', data);
      }
    } catch (error) {
      console.error('Failed to fetch payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    alert('CSV export coming soon!');
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      in_transit: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || styles.pending}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payouts</h1>
          <p className="mt-2 text-gray-600">
            View your payout history and schedule
          </p>
          {dataSource && (
            <p className="mt-1 text-xs text-gray-500">
              Data source: {
                dataSource === 'fortis_batches' ? '✓ Fortis Settlement Batches' :
                dataSource === 'fortis_settlements' ? `✓ Fortis Settlements${fortisEndpoint ? ` (${fortisEndpoint})` : ''}` :
                dataSource === 'local_transactions' ? '⚠️ Calculated from transactions (Fortis API unavailable)' :
                dataSource
              }
            </p>
          )}
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Paid Out
            </CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalPaidOut)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              All time payouts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Payout
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.pendingPayout)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Awaiting transfer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Next Payout
            </CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {stats.nextPayoutDate ? formatDate(stats.nextPayoutDate) : 'Not scheduled'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Estimated date
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No payouts yet</p>
          ) : (
            <div className="space-y-3">
              {payouts.map((payout) => (
                <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {formatDate(payout.periodStart)} - {formatDate(payout.periodEnd)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {payout.transactionCount} transactions
                      {payout.paidAt && ` • Paid on ${formatDate(payout.paidAt)}`}
                    </p>
                  </div>
                  <div className="text-right space-y-2">
                    <div>
                      <p className="text-lg font-bold text-blue-600">
                        {formatCurrency(payout.net)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Gross: {formatCurrency(payout.amount)} • Fee: {formatCurrency(payout.fee)}
                      </p>
                    </div>
                    {getStatusBadge(payout.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


