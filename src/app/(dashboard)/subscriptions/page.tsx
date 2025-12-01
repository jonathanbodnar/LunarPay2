'use client';

import { useEffect, useState } from 'react';
import { Repeat, Play, Pause, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Subscription {
  id: number;
  amount: number;
  frequency: string;
  status: string;
  nextPaymentOn: string;
  donor: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/subscriptions');
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

  const getFrequencyText = (freq: string) => {
    const map: Record<string, string> = {
      weekly: 'Weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      yearly: 'Yearly',
      Custom: 'Custom',
    };
    return map[freq] || freq;
  };

  const getStatusBadge = (status: string) => {
    return status === 'A' ? (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
        Active
      </span>
    ) : (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
        Cancelled
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subscriptions</h1>
          <p className="mt-2 text-gray-600">Manage recurring payments</p>
        </div>
        <Button>Create Subscription</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
            <Repeat className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {subscriptions.filter(s => s.status === 'A').length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Subscriptions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Monthly Revenue</CardTitle>
            <Repeat className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">$0.00</div>
            <p className="text-xs text-gray-500 mt-1">Recurring</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Cancelled</CardTitle>
            <X className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {subscriptions.filter(s => s.status === 'D').length}
            </div>
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : subscriptions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Repeat className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No subscriptions yet</h3>
            <p className="text-gray-500 text-center mb-6">
              Recurring subscriptions will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">
                        {sub.donor.firstName} {sub.donor.lastName}
                      </p>
                      {getStatusBadge(sub.status)}
                    </div>
                    <p className="text-sm text-gray-600">{sub.donor.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Next payment: {formatDate(sub.nextPaymentOn)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">
                      {formatCurrency(Number(sub.amount))}
                    </p>
                    <p className="text-sm text-gray-500">{getFrequencyText(sub.frequency)}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {sub.status === 'A' ? (
                      <>
                        <Button size="sm" variant="outline">
                          <Pause className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="outline">
                        <Play className="h-4 w-4" />
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
