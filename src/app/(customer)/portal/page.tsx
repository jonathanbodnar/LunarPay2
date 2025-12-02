'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CreditCard, FileText, LogOut, User, Plus } from 'lucide-react';

interface CustomerPortalData {
  customer: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
  transactions: Array<{
    id: number;
    amount: number;
    status: string;
    createdAt: string;
    invoice?: {
      reference: string;
    };
  }>;
  savedPaymentMethods: Array<{
    id: number;
    type: string;
    last4: string;
    brand: string;
    expiryMonth: number;
    expiryYear: number;
    isDefault: boolean;
  }>;
  subscriptions: Array<{
    id: number;
    amount: number;
    interval: string;
    status: string;
    nextBillingDate: string | null;
  }>;
  invoices: Array<{
    id: number;
    reference: string;
    totalAmount: number;
    status: string;
    dueDate: string | null;
    hash: string;
  }>;
}

export default function CustomerPortalPage() {
  const router = useRouter();
  const [data, setData] = useState<CustomerPortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'invoices' | 'payment-methods' | 'subscriptions'>('overview');

  useEffect(() => {
    fetchPortalData();
  }, []);

  const fetchPortalData = async () => {
    try {
      const response = await fetch('/api/customer/portal', {
        credentials: 'include',
      });

      if (response.ok) {
        const portalData = await response.json();
        setData(portalData);
      } else if (response.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to fetch portal data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    router.push('/login');
  };

  const handleDeletePaymentMethod = async (paymentMethodId: number) => {
    if (!confirm('Are you sure you want to remove this payment method?')) return;

    try {
      const response = await fetch(`/api/customer/payment-methods/${paymentMethodId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        fetchPortalData();
      } else {
        alert('Failed to remove payment method');
      }
    } catch (error) {
      alert('Error removing payment method');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600">Unable to load account data</p>
            <Button onClick={() => router.push('/login')} className="mt-4">
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Customer Portal</h1>
              <p className="text-gray-600">
                Welcome, {data.customer.firstName} {data.customer.lastName}
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6">
            {[
              { id: 'overview', label: 'Overview', icon: User },
              { id: 'transactions', label: 'Transactions', icon: FileText },
              { id: 'invoices', label: 'Invoices', icon: FileText },
              { id: 'payment-methods', label: 'Payment Methods', icon: CreditCard },
              { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 px-2 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Spent</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(data.transactions.reduce((sum, t) => sum + (t.status === 'succeeded' ? t.amount : 0), 0))}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{data.transactions.length}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Active Subscriptions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {data.subscriptions.filter(s => s.status === 'active').length}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'transactions' && (
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              {data.transactions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No transactions yet</p>
              ) : (
                <div className="space-y-3">
                  {data.transactions.map((transaction) => (
                    <div key={transaction.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {transaction.invoice?.reference || `Transaction #${transaction.id}`}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(transaction.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600">
                          {formatCurrency(transaction.amount)}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          transaction.status === 'succeeded' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'invoices' && (
          <Card>
            <CardHeader>
              <CardTitle>Your Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {data.invoices.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No invoices</p>
              ) : (
                <div className="space-y-3">
                  {data.invoices.map((invoice) => (
                    <div key={invoice.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Invoice #{invoice.reference}</p>
                        <p className="text-sm text-gray-500">
                          Due: {invoice.dueDate ? formatDate(invoice.dueDate) : 'No due date'}
                        </p>
                      </div>
                      <div className="text-right space-y-2">
                        <p className="font-bold text-blue-600">
                          {formatCurrency(Number(invoice.totalAmount))}
                        </p>
                        {invoice.status === 'sent' || invoice.status === 'finalized' ? (
                          <Button
                            size="sm"
                            onClick={() => window.open(`/invoice/${invoice.hash}`, '_blank')}
                          >
                            Pay Now
                          </Button>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                            {invoice.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'payment-methods' && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Saved Payment Methods</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {data.savedPaymentMethods.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No saved payment methods</p>
              ) : (
                <div className="space-y-3">
                  {data.savedPaymentMethods.map((method) => (
                    <div key={method.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <CreditCard className="h-8 w-8 text-gray-400" />
                        <div>
                          <p className="font-medium">
                            {method.brand} •••• {method.last4}
                          </p>
                          <p className="text-sm text-gray-500">
                            Expires {method.expiryMonth}/{method.expiryYear}
                          </p>
                          {method.isDefault && (
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                              Default
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeletePaymentMethod(method.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'subscriptions' && (
          <Card>
            <CardHeader>
              <CardTitle>Your Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              {data.subscriptions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No active subscriptions</p>
              ) : (
                <div className="space-y-3">
                  {data.subscriptions.map((subscription) => (
                    <div key={subscription.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {formatCurrency(subscription.amount)} / {subscription.interval}
                        </p>
                        {subscription.nextBillingDate && (
                          <p className="text-sm text-gray-500">
                            Next billing: {formatDate(subscription.nextBillingDate)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          subscription.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {subscription.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

