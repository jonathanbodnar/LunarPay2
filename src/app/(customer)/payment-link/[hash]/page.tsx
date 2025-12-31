'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    primaryColor: string | null;
    backgroundColor: string | null;
    buttonTextColor: string | null;
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

  // Branding colors with defaults
  const primaryColor = paymentLink?.organization?.primaryColor || '#000000';
  const backgroundColor = paymentLink?.organization?.backgroundColor || '#ffffff';
  const buttonTextColor = paymentLink?.organization?.buttonTextColor || '#ffffff';

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
    setProcessing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor }}>
        <div className="text-center">
          <div 
            className="animate-spin h-8 w-8 border-4 border-t-transparent rounded-full mx-auto mb-4"
            style={{ borderColor: primaryColor }}
          />
          <p style={{ color: `${primaryColor}80` }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !paymentLink) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4" style={{ backgroundColor }}>
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4" style={{ color: `${primaryColor}60` }} />
            <h2 className="text-xl font-semibold mb-2">Page Not Found</h2>
            <p className="text-muted-foreground">{error || 'This payment link does not exist.'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const total = calculateTotal();
  const hasItems = Object.values(cart).some(qty => qty > 0);

  return (
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {paymentLink.organization.logo ? (
            <img 
              src={paymentLink.organization.logo} 
              alt={paymentLink.organization.name} 
              className="h-14 mx-auto mb-4 object-contain" 
            />
          ) : (
            <h2 
              className="text-lg font-bold mb-2"
              style={{ color: primaryColor }}
            >
              {paymentLink.organization.name}
            </h2>
          )}
          <h1 className="text-3xl font-bold">{paymentLink.name}</h1>
          {paymentLink.description && (
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">{paymentLink.description}</p>
          )}
          {!paymentLink.organization.logo && (
            <p className="text-sm text-muted-foreground mt-1">by {paymentLink.organization.name}</p>
          )}
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
                  <CardTitle className="text-lg">{item.product.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <span className="font-semibold" style={{ color: primaryColor }}>
                      {formatCurrency(Number(item.product.price))}
                    </span>
                    {!item.unlimited && (
                      <span className="text-xs text-muted-foreground">
                        ({item.available} available)
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {item.product.description && (
                    <p className="text-sm text-muted-foreground mb-4">{item.product.description}</p>
                  )}
                  
                  {isAvailable ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          className="h-9 w-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50"
                          onClick={() => updateQuantity(item.id, -1)}
                          disabled={quantity === 0}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-12 text-center font-medium">{quantity}</span>
                        <button
                          className="h-9 w-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50"
                          onClick={() => updateQuantity(item.id, 1)}
                          disabled={quantity >= maxQty}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      {quantity > 0 && (
                        <span className="font-semibold" style={{ color: primaryColor }}>
                          {formatCurrency(Number(item.product.price) * quantity)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-destructive text-sm font-medium">Out of stock</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Checkout */}
        {hasItems && (
          <Card className="sticky bottom-4 shadow-lg border-2" style={{ borderColor: `${primaryColor}30` }}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-2xl font-bold" style={{ color: primaryColor }}>
                  {formatCurrency(total)}
                </span>
              </div>
              <button 
                className="w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: primaryColor, color: buttonTextColor }}
                onClick={handleCheckout} 
                disabled={processing}
              >
                <CreditCard className="h-5 w-5" />
                {processing ? 'Processing...' : 'Proceed to Payment'}
              </button>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          Powered by LunarPay
        </p>
      </div>
    </div>
  );
}
