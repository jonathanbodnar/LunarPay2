'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ShoppingCart, CreditCard, Minus, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface PaymentLink {
  id: number;
  name: string;
  description: string | null;
  status: string;
  paymentMethods: string | null;
  organization: {
    name: string;
    logo: string | null;
  };
  products: Array<{
    id: number;
    productId: number;
    product: {
      name: string;
      description: string | null;
      price: number;
    };
    qty: number | null;
    unlimitedQty: boolean;
    available: number | null;
    unlimited: boolean;
  }>;
}

export default function PaymentLinkPage() {
  const params = useParams();
  const hash = params?.hash as string;
  const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cart, setCart] = useState<Record<number, number>>({});
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPaymentLink();
  }, [hash]);

  const fetchPaymentLink = async () => {
    try {
      const response = await fetch(`/api/payment-links/public/${hash}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment link not found');
      }

      setPaymentLink(data.paymentLink);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => {
      const current = prev[productId] || 0;
      const newQty = Math.max(0, current + delta);
      if (newQty === 0) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: newQty };
    });
  };

  const calculateTotal = () => {
    if (!paymentLink) return 0;
    return paymentLink.products.reduce((sum, item) => {
      const qty = cart[item.id] || 0;
      return sum + (Number(item.product.price) * qty);
    }, 0);
  };

  const handleCheckout = () => {
    setProcessing(true);
    // TODO: Open Fortis Elements payment modal
    alert('Payment processing will open here with Fortis Elements');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !paymentLink) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Page Not Found</h2>
            <p className="text-gray-500">{error || 'This payment link does not exist.'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const total = calculateTotal();
  const hasItems = Object.values(cart).some(qty => qty > 0);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {paymentLink.organization.logo && (
            <img src={paymentLink.organization.logo} alt={paymentLink.organization.name} className="h-16 mx-auto mb-4" />
          )}
          <h1 className="text-3xl font-bold text-gray-900">{paymentLink.name}</h1>
          {paymentLink.description && (
            <p className="text-gray-600 mt-2">{paymentLink.description}</p>
          )}
          <p className="text-sm text-gray-500 mt-1">by {paymentLink.organization.name}</p>
        </div>

        {/* Products */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {paymentLink.products.map((item) => {
            const quantity = cart[item.id] || 0;
            const isAvailable = item.unlimited || (item.available !== null && item.available > 0);
            const maxQty = item.unlimited ? 999 : (item.available || 0);

            return (
              <Card key={item.id} className={!isAvailable ? 'opacity-60' : ''}>
                <CardHeader>
                  <CardTitle>{item.product.name}</CardTitle>
                  <CardDescription>
                    {formatCurrency(Number(item.product.price))}
                    {!item.unlimited && (
                      <span className="ml-2 text-xs">
                        ({item.available} available)
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {item.product.description && (
                    <p className="text-sm text-gray-600 mb-4">{item.product.description}</p>
                  )}
                  
                  {isAvailable ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, -1)}
                          disabled={quantity === 0}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center font-medium">{quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, 1)}
                          disabled={quantity >= maxQty}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {quantity > 0 && (
                        <span className="font-semibold text-blue-600">
                          {formatCurrency(Number(item.product.price) * quantity)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-red-600 text-sm font-medium">Out of stock</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Checkout */}
        {hasItems && (
          <Card className="sticky bottom-4 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-2xl font-bold text-blue-600">{formatCurrency(total)}</span>
              </div>
              <Button size="lg" className="w-full" onClick={handleCheckout} disabled={processing}>
                <CreditCard className="mr-2 h-5 w-5" />
                {processing ? 'Processing...' : 'Proceed to Payment'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

