'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CreditCard, Building2, Landmark, Lock, Minus, Plus, ShoppingCart } from 'lucide-react';
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
      isSubscription: boolean;
      subscriptionInterval: string | null;
      subscriptionIntervalCount: number | null;
      subscriptionTrialDays: number | null;
    };
    qty: number | null;
    unlimitedQty: boolean;
    available: number | null;
    unlimited: boolean;
  }>;
}

// Helper to format subscription frequency
const formatFrequency = (interval: string | null, count: number | null): string => {
  if (!interval) return '';
  const intervalMap: Record<string, string> = {
    'daily': 'daily',
    'weekly': 'weekly',
    'monthly': 'monthly',
    'quarterly': 'quarterly',
    'yearly': 'yearly',
    'annual': 'annually',
  };
  if (count && count > 1) {
    return `every ${count} ${interval}s`;
  }
  return intervalMap[interval.toLowerCase()] || interval;
};

export default function PaymentLinkPage() {
  const params = useParams();
  const hash = params?.hash as string;
  const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cart, setCart] = useState<Record<number, number>>({});
  const [processing, setProcessing] = useState(false);
  
  // Form state
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'amex' | 'bank'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cardName, setCardName] = useState('');

  // Branding colors with defaults
  const primaryColor = paymentLink?.organization?.primaryColor || '#000000';
  const backgroundColor = paymentLink?.organization?.backgroundColor || '#f8fafc';
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
      
      // Initialize cart with 1 of each product if single product
      if (data.paymentLink.products.length === 1) {
        const product = data.paymentLink.products[0];
        const isAvailable = product.unlimited || (product.available !== null && product.available > 0);
        if (isAvailable) {
          setCart({ [product.id]: 1 });
        }
      }
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

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : v;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    // TODO: Integrate with Fortis Elements payment modal
    alert('Payment processing will be integrated with Fortis Elements');
    setProcessing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-black border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !paymentLink) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 px-4">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full text-center">
          <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold mb-2">Page Not Found</h2>
          <p className="text-gray-500">{error || 'This payment link does not exist.'}</p>
        </div>
      </div>
    );
  }

  const total = calculateTotal();
  const hasItems = Object.values(cart).some(qty => qty > 0);
  const selectedProducts = paymentLink.products.filter(item => cart[item.id] > 0);
  
  // Check if any selected product is a subscription
  const hasSubscription = selectedProducts.some(item => item.product.isSubscription);
  const subscriptionProduct = selectedProducts.find(item => item.product.isSubscription);

  return (
    <div className="min-h-screen" style={{ backgroundColor }}>
      <div className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          
          {/* Left Column - Order Details */}
          <div className="space-y-6">
            {/* Logo/Brand */}
            <div>
              {paymentLink.organization.logo ? (
                <img 
                  src={paymentLink.organization.logo} 
                  alt={paymentLink.organization.name} 
                  className="h-12 object-contain" 
                />
              ) : (
                <h2 
                  className="text-2xl font-bold tracking-tight"
                  style={{ color: primaryColor }}
                >
                  {paymentLink.organization.name.toUpperCase()}
                </h2>
              )}
            </div>

            {/* Pay To */}
            <p className="text-gray-600">
              Pay to <span className="font-medium text-gray-900">{paymentLink.organization.name}</span>
            </p>

            {/* Amount */}
            <div>
              <p className="text-5xl font-light text-gray-900">
                {formatCurrency(total)}
                {hasSubscription && subscriptionProduct && (
                  <span className="text-xl text-gray-500 ml-2">
                    {formatFrequency(subscriptionProduct.product.subscriptionInterval, subscriptionProduct.product.subscriptionIntervalCount)}
                  </span>
                )}
              </p>
              <p className="text-gray-500 mt-1">
                {hasSubscription && subscriptionProduct?.product.subscriptionTrialDays 
                  ? `${subscriptionProduct.product.subscriptionTrialDays} day trial, then billed ${formatFrequency(subscriptionProduct.product.subscriptionInterval, subscriptionProduct.product.subscriptionIntervalCount)}`
                  : 'Due today'
                }
              </p>
            </div>

            {/* Divider */}
            <hr className="border-gray-200" />

            {/* Line Items */}
            {paymentLink.products.length === 1 ? (
              // Single product - simple display
              <div className="space-y-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{paymentLink.products[0].product.name}</p>
                    {paymentLink.products[0].product.description && (
                      <p className="text-sm text-gray-500">{paymentLink.products[0].product.description}</p>
                    )}
                    {paymentLink.products[0].product.isSubscription && paymentLink.products[0].product.subscriptionTrialDays && (
                      <p className="text-sm text-gray-500">
                        ({paymentLink.products[0].product.subscriptionTrialDays} days trial)
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatCurrency(Number(paymentLink.products[0].product.price))}
                      {paymentLink.products[0].product.isSubscription && (
                        <span className="text-gray-500 font-normal">
                          {' '}{formatFrequency(paymentLink.products[0].product.subscriptionInterval, paymentLink.products[0].product.subscriptionIntervalCount)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <hr className="border-gray-100 mt-4" />
              </div>
            ) : (
              // Multiple products - selectable
              <div className="space-y-4">
                {paymentLink.products.map((item) => {
                  const quantity = cart[item.id] || 0;
                  const isAvailable = item.unlimited || (item.available !== null && item.available > 0);
                  const maxQty = item.unlimited ? 999 : (item.available || 0);

                  return (
                    <div key={item.id} className={`p-4 rounded-lg border ${!isAvailable ? 'opacity-50 bg-gray-50' : 'bg-white'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.product.name}</p>
                          {item.product.description && (
                            <p className="text-sm text-gray-500">{item.product.description}</p>
                          )}
                          {item.product.isSubscription && item.product.subscriptionTrialDays && (
                            <p className="text-sm text-gray-500">
                              ({item.product.subscriptionTrialDays} days trial)
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium" style={{ color: primaryColor }}>
                            {formatCurrency(Number(item.product.price))}
                          </p>
                          {item.product.isSubscription && (
                            <p className="text-xs text-gray-500">
                              {formatFrequency(item.product.subscriptionInterval, item.product.subscriptionIntervalCount)}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {isAvailable ? (
                        <div className="flex items-center gap-3 mt-3">
                          <button
                            className="h-8 w-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                            onClick={() => updateQuantity(item.id, -1)}
                            disabled={quantity === 0}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center font-medium">{quantity}</span>
                          <button
                            className="h-8 w-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                            onClick={() => updateQuantity(item.id, 1)}
                            disabled={quantity >= maxQty}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          {quantity > 0 && (
                            <span className="ml-auto font-medium">
                              {formatCurrency(Number(item.product.price) * quantity)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-red-500 mt-2">Out of stock</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Footer */}
            <div className="pt-8 mt-auto">
              <p className="text-sm text-gray-400 flex items-center gap-2">
                Powered by <span className="font-semibold text-gray-600">Lunar<span style={{ color: primaryColor }}>Pay</span></span>
              </p>
            </div>
          </div>

          {/* Right Column - Payment Form */}
          <div className="bg-white rounded-lg shadow-sm p-6 lg:p-8 h-fit">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                  placeholder="you@example.com"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Payment method</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                      paymentMethod === 'card' 
                        ? 'border-black bg-gray-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CreditCard className="h-6 w-6" />
                    <span className="text-xs font-medium">Credit / Debit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('amex')}
                    className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                      paymentMethod === 'amex' 
                        ? 'border-black bg-gray-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="h-6 w-10 bg-blue-600 rounded text-white text-[8px] font-bold flex items-center justify-center">
                      AMEX
                    </div>
                    <span className="text-xs font-medium">American Express</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank')}
                    className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                      paymentMethod === 'bank' 
                        ? 'border-black bg-gray-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Landmark className="h-6 w-6" />
                    <span className="text-xs font-medium">Bank Transfer</span>
                  </button>
                </div>
              </div>

              {/* Payment Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Info</h3>
                
                {paymentMethod !== 'bank' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          maxLength={19}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none pr-12"
                          placeholder="1234 5678 9012 3456"
                        />
                        <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Expiration Date (MM/YY)</label>
                      <input
                        type="text"
                        required
                        value={expiry}
                        onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                        maxLength={5}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                        placeholder="MM/YY"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name on Card</label>
                      <input
                        type="text"
                        required
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                        placeholder="John Smith"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Routing Number</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                        placeholder="123456789"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                        placeholder="1234567890"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Account Holder Name</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                        placeholder="John Smith"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={processing || !hasItems}
                className="w-full py-4 rounded-lg font-medium text-lg transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: primaryColor, color: buttonTextColor }}
              >
                {processing 
                  ? 'Processing...' 
                  : !hasItems 
                    ? 'Select items to continue'
                    : hasSubscription 
                      ? 'Subscribe' 
                      : `Pay ${formatCurrency(total)}`
                }
              </button>

              {/* Terms */}
              <p className="text-xs text-gray-500 text-center leading-relaxed">
                By clicking on "{hasSubscription ? 'Subscribe' : 'Pay'}", you agree to allow {paymentLink.organization.name} to charge your card for this payment{hasSubscription ? ' and future payments according to the payment frequency listed' : ''}.
              </p>

              {/* Security */}
              <div className="text-center space-y-1">
                <p className="text-sm text-gray-600 flex items-center justify-center gap-1">
                  <Lock className="h-4 w-4" />
                  Securely encrypted by SSL
                </p>
                <a 
                  href="https://lunarpay.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm hover:underline"
                  style={{ color: primaryColor }}
                >
                  LunarPay.com
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
