'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Link as LinkIcon, Plus, ExternalLink, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PaymentLink {
  id: number;
  name: string;
  description: string | null;
  status: string;
  hash: string;
  organization: {
    name: string;
  };
  products: any[];
  _count: {
    productsPaid: number;
  };
}

export default function PaymentLinksPage() {
  const router = useRouter();
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentLinks();
  }, []);

  const fetchPaymentLinks = async () => {
    try {
      const response = await fetch('/api/payment-links');
      if (response.ok) {
        const data = await response.json();
        setPaymentLinks(data.paymentLinks || []);
      }
    } catch (error) {
      console.error('Failed to fetch payment links:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading payment links...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Links</h1>
          <p className="mt-2 text-gray-600">
            Create shareable payment collection pages
          </p>
        </div>
        <Button onClick={() => router.push('/payment-links/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Payment Link
        </Button>
      </div>

      {paymentLinks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LinkIcon className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No payment links yet</h3>
            <p className="text-gray-500 text-center mb-6">
              Create your first payment link to start collecting payments
            </p>
            <Button onClick={() => router.push('/payment-links/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Payment Link
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paymentLinks.map((link) => (
            <Card key={link.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{link.name}</CardTitle>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      link.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {link.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {link.description && (
                  <p className="text-sm text-gray-600">{link.description}</p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{link.products.length} products</span>
                  <span className="text-gray-500">{link._count.productsPaid} purchases</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/payment-links/${link.id}/edit`)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(`/payment-link/${link.hash}`, '_blank')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

