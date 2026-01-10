'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Plus, CreditCard, Building2, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';

interface PaymentMethod {
  id: number;
  sourceType: string;
  lastDigits: string | null;
  bankType: string | null;
  isDefault: boolean;
}

interface Customer {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  amountAcum: number;
  createdAt: string;
  organization: {
    name: string;
  };
  defaultPaymentMethod: PaymentMethod | null;
  _count: {
    transactions: number;
    sources: number;
    subscriptions: number;
  };
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const name = `${customer.firstName || ''} ${customer.lastName || ''}`.toLowerCase();
    const email = (customer.email || '').toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  // Format payment method display
  const formatPaymentMethod = (pm: PaymentMethod | null) => {
    if (!pm) return null;
    
    if (pm.sourceType === 'CC') {
      const brand = pm.bankType?.toLowerCase() || 'card';
      return {
        icon: '💳',
        label: `${brand.charAt(0).toUpperCase() + brand.slice(1)} •••• ${pm.lastDigits || '****'}`,
      };
    } else if (pm.sourceType === 'BNK') {
      return {
        icon: '🏦',
        label: `Bank •••• ${pm.lastDigits || '****'}`,
      };
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Customers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {customers.length} total customers
          </p>
        </div>
        <Button onClick={() => router.push('/customers/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search customers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {customers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No customers yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Add your first customer to get started
            </p>
            <Button onClick={() => router.push('/customers/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-card">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 text-sm font-medium text-muted-foreground border-b">
            <div className="col-span-4">Customer</div>
            <div className="col-span-2">Payment Method</div>
            <div className="col-span-2 text-right">Total Spent</div>
            <div className="col-span-2 text-center">Transactions</div>
            <div className="col-span-2 text-center">Subscriptions</div>
          </div>

          {/* Table Body */}
          <div className="divide-y">
            {filteredCustomers.map((customer) => {
              const paymentMethod = formatPaymentMethod(customer.defaultPaymentMethod);
              
              return (
                <div
                  key={customer.id}
                  className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => router.push(`/customers/${customer.id}`)}
                >
                  {/* Customer Info */}
                  <div className="col-span-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                        {(customer.firstName?.[0] || customer.email?.[0] || '?').toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {customer.firstName || customer.lastName 
                            ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
                            : 'No name'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {customer.email || 'No email'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="col-span-2">
                    {paymentMethod ? (
                      <div className="flex items-center gap-2 text-sm">
                        <span>{paymentMethod.icon}</span>
                        <span className="text-muted-foreground truncate">{paymentMethod.label}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>

                  {/* Total Spent */}
                  <div className="col-span-2 text-right">
                    <span className="font-medium text-sm">
                      {formatCurrency(Number(customer.amountAcum || 0))}
                    </span>
                  </div>

                  {/* Transaction Count */}
                  <div className="col-span-2 text-center">
                    <span className="text-sm text-muted-foreground">
                      {customer._count.transactions}
                    </span>
                  </div>

                  {/* Subscriptions */}
                  <div className="col-span-2 text-center">
                    {customer._count.subscriptions > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {customer._count.subscriptions} active
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty search state */}
          {filteredCustomers.length === 0 && searchQuery && (
            <div className="px-4 py-8 text-center text-muted-foreground">
              No customers found matching &quot;{searchQuery}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
}

