'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Phone, MapPin, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchCustomer();
    }
  }, [params.id]);

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`/api/customers/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setCustomer(data.customer);
      }
    } catch (error) {
      console.error('Failed to fetch customer:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>;
  }

  if (!customer) {
    return <div>Customer not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {customer.firstName} {customer.lastName}
            </h1>
            <p className="mt-2 text-gray-600">{customer.email}</p>
          </div>
        </div>
        <Button onClick={() => router.push(`/customers/${customer.id}/edit`)}>
          Edit
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{customer.email || '-'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{customer.phone || '-'}</p>
                </div>
              </div>
            </div>

            {(customer.address || customer.city || customer.state) && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">
                    {customer.address}<br />
                    {customer.city}, {customer.state} {customer.zip}
                  </p>
                </div>
              </div>
            )}

            <div>
              <p className="text-sm text-gray-500">Organization</p>
              <p className="font-medium">{customer.organization?.name || '-'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Giving Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Total Given</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(Number(customer.amountAcum || 0))}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Net Amount</p>
              <p className="text-lg font-medium">
                {formatCurrency(Number(customer.netAcum || 0))}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Transactions</p>
              <p className="text-lg font-medium">{customer._count?.transactions || 0}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Payment Methods</p>
              <p className="text-lg font-medium">{customer._count?.sources || 0}</p>
            </div>

            {customer.firstDate && (
              <div>
                <p className="text-sm text-gray-500">First Donation</p>
                <p className="font-medium">{formatDate(customer.firstDate)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transaction History</CardTitle>
            <Button variant="outline" size="sm">View All</Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            No transactions yet
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payment Methods</CardTitle>
            <Button variant="outline" size="sm">
              <CreditCard className="mr-2 h-4 w-4" />
              Add Payment Method
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            No saved payment methods
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

