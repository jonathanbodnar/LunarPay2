'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { RefreshCw, StopCircle, PlayCircle } from 'lucide-react';

interface Subscription {
  id: number;
  amount: number;
  interval: string;
  status: string;
  startDate: string;
  nextBillingDate: string | null;
  lastPaymentDate: string | null;
  createdAt: string;
  donor: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
  organization: {
    name: string;
  };
  product: {
    name: string;
  } | null;
}

export default function SubscriptionsPage() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'canceled'>('all');

  useEffect(() => {
    fetchSubscriptions();
  }, [filter]);

  const fetchSubscriptions = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);

      const response = await fetch(`/api/subscriptions?${params.toString()}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data.subscriptions || []);
      }
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (subscriptionId: number) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;

    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        alert('Subscription canceled successfully');
        fetchSubscriptions();
      } else {
        alert('Failed to cancel subscription');
      }
    } catch (error) {
      alert('Error canceling subscription');
    }
  };

  const handleReactivate = async (subscriptionId: number) => {
    if (!confirm('Are you sure you want to reactivate this subscription?')) return;

    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}/reactivate`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        alert('Subscription reactivated successfully');
        fetchSubscriptions();
      } else {
        alert('Failed to reactivate subscription');
      }
    } catch (error) {
      alert('Error reactivating subscription');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      canceled: 'bg-gray-100 text-gray-800',
      past_due: 'bg-red-100 text-red-800',
      paused: 'bg-yellow-100 text-yellow-800',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || styles.active}`}>
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getIntervalLabel = (interval: string) => {
    const labels: Record<string, string> = {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      yearly: 'Yearly',
    };
    return labels[interval] || interval;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subscriptions</h1>
          <p className="mt-2 text-gray-600">Manage recurring payments</p>
        </div>
        <Button variant="outline" onClick={fetchSubscriptions}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'active' ? 'default' : 'outline'}
          onClick={() => setFilter('active')}
        >
          Active
        </Button>
        <Button
          variant={filter === 'canceled' ? 'default' : 'outline'}
          onClick={() => setFilter('canceled')}
        >
          Canceled
        </Button>
      </div>

      {subscriptions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No subscriptions found</h3>
            <p className="text-gray-500 text-center">
              {filter === 'all'
                ? 'No recurring payments have been set up yet'
                : `No ${filter} subscriptions found`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Subscriptions ({subscriptions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subscriptions.map((subscription) => (
                <div
                  key={subscription.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium">
                        {subscription.donor.firstName} {subscription.donor.lastName}
                      </span>
                      {getStatusBadge(subscription.status)}
                      <span className="text-sm text-gray-500">
                        {getIntervalLabel(subscription.interval)}
                      </span>
                    </div>
                    {subscription.product && (
                      <p className="text-sm text-gray-600 mb-1">
                        {subscription.product.name}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      {subscription.donor.email} • {subscription.organization.name}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>Started: {formatDate(subscription.startDate)}</span>
                      {subscription.nextBillingDate && (
                        <span>Next: {formatDate(subscription.nextBillingDate)}</span>
                      )}
                      {subscription.lastPaymentDate && (
                        <span>Last: {formatDate(subscription.lastPaymentDate)}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <p className="text-lg font-bold text-blue-600">
                      {formatCurrency(Number(subscription.amount))}
                      <span className="text-sm text-gray-500">/{subscription.interval}</span>
                    </p>
                    {subscription.status === 'active' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancel(subscription.id)}
                      >
                        <StopCircle className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    ) : subscription.status === 'canceled' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReactivate(subscription.id)}
                      >
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Reactivate
                      </Button>
                    ) : null}
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
