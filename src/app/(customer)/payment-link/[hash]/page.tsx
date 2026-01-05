'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CreditCard, Landmark, Lock, Minus, Plus, ShoppingCart, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';

interface PaymentLink {
  id: number;
  name: string;
  description: string | null;
  status: string;
  paymentMethods: string | null;
  organizationId: number;
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

declare global {
  interface Window {
    PayForm?: any;
  }
}

// Helper to format subscription frequency
const formatFrequency = (interval: string | null, count: number | null): string => {
  if (!interval) return '';
  const intervalMap: Record<string, string> = {
    'daily': '/day',
    'weekly': '/week',
    'monthly': '/mo',
    'quarterly': '/quarter',
    'yearly': '/year',
    'annual': '/year',
  };
  if (count && count > 1) {
    return `every ${count} ${interval}s`;
  }
  return intervalMap[interval.toLowerCase()] || `/${interval}`;
};

export default function PaymentLinkPage() {
  const params = useParams();
  const hash = params?.hash as string;
  const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cart, setCart] = useState<Record<number, number>>({});
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  
  // Form state
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank'>('card');
  const [savePaymentMethod, setSavePaymentMethod] = useState(false);
  
  // Fortis Elements state
  const [clientToken, setClientToken] = useState<string | null>(null);
  const [fortisLoaded, setFortisLoaded] = useState(false);
  const [payForm, setPayForm] = useState<any>(null);

  // Branding colors with defaults
  const primaryColor = paymentLink?.organization?.primaryColor || '#000000';
  const backgroundColor = paymentLink?.organization?.backgroundColor || '#f8fafc';
  const buttonTextColor = paymentLink?.organization?.buttonTextColor || '#ffffff';

  useEffect(() => {
    fetchPaymentLink();
  }, [hash]);

  // Load Fortis Elements script
  useEffect(() => {
    if (!paymentLink) return;
    
    if (window.PayForm) {
      setFortisLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.fortis.tech/commercejs-v1.0.0.min.js';
    script.async = true;
    script.onload = () => {
      setFortisLoaded(true);
    };
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [paymentLink]);

  // Calculate total
  const calculateTotal = () => {
    if (!paymentLink) return 0;
    return paymentLink.products.reduce((sum, item) => {
      const qty = cart[item.id] || 0;
      return sum + (Number(item.product.price) * qty);
    }, 0);
  };

  // Initialize Fortis payment form when token and total are ready
  useEffect(() => {
    if (!clientToken || !fortisLoaded || !window.PayForm) return;

    try {
      const config = {
        container: '#payment-form-container',
        theme: 'default',
        environment: 'sandbox',
        floatingLabels: true,
        showReceipt: false,
        showSubmitButton: false,
        fields: paymentMethod === 'card' 
          ? ['account_holder_name', 'account_number', 'exp_date', 'cvv']
          : ['account_holder_name', 'routing_number', 'account_number', 'account_type'],
        styles: {
          'input': {
            'border': '1px solid #d1d5db',
            'border-radius': '0.5rem',
            'padding': '0.75rem 1rem',
            'font-size': '1rem',
          },
          'input:focus': {
            'border-color': primaryColor,
            'outline': 'none',
            'box-shadow': `0 0 0 2px ${primaryColor}33`,
          },
          'label': {
            'color': '#374151',
            'font-size': '0.875rem',
            'font-weight': '500',
          },
        },
      };

      const form = new window.PayForm(clientToken, config);
      
      form.on('ready', () => {
        console.log('[Fortis] Payment form ready');
      });

      form.on('error', (err: any) => {
        console.error('[Fortis] Form error:', err);
        setPaymentError(err.message || 'Payment form error');
      });

      form.on('tokenized', async (response: any) => {
        console.log('[Fortis] Payment tokenized:', response);
        await processPayment(response);
      });

      setPayForm(form);
    } catch (err) {
      console.error('[Fortis] Init error:', err);
      setPaymentError('Failed to initialize payment form');
    }
  }, [clientToken, fortisLoaded, paymentMethod, primaryColor]);

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
          // Get token for this amount
          await getPaymentToken(
            data.paymentLink.organizationId, 
            Number(product.product.price),
            data.paymentLink.id
          );
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentToken = async (orgId: number, amount: number, linkId: number) => {
    if (amount <= 0) return;
    
    try {
      const response = await fetch('/api/public/fortis/transaction-intention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: orgId,
          amount,
          action: 'sale',
          type: 'payment_link',
          referenceId: linkId,
          savePaymentMethod,
        }),
      });

      const data = await response.json();
      
      if (data.success && data.clientToken) {
        setClientToken(data.clientToken);
      } else {
        setPaymentError(data.error || 'Unable to initialize payment');
      }
    } catch (err) {
      console.error('Token error:', err);
      setPaymentError('Unable to initialize payment form');
    }
  };

  // Update cart and refresh token when total changes
  const updateQuantity = async (productId: number, delta: number) => {
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

  // Recalculate token when cart changes
  useEffect(() => {
    if (!paymentLink) return;
    const total = calculateTotal();
    if (total > 0) {
      // Debounce the token fetch
      const timeout = setTimeout(() => {
        setClientToken(null);
        setPayForm(null);
        getPaymentToken(paymentLink.organizationId, total, paymentLink.id);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [cart, paymentLink]);

  const processPayment = async (fortisResponse: any) => {
    if (!paymentLink) return;

    try {
      const response = await fetch('/api/public/fortis/process-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'payment_link',
          referenceId: paymentLink.id,
          organizationId: paymentLink.organizationId,
          customerEmail: email,
          fortisResponse,
          savePaymentMethod,
          cart, // Include cart for product tracking
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPaymentSuccess(true);
        setProcessing(false);
      } else {
        setPaymentError(data.error || 'Payment failed');
        setProcessing(false);
      }
    } catch (err) {
      console.error('Process error:', err);
      setPaymentError('Failed to process payment');
      setProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!payForm) {
      setPaymentError('Payment form not ready');
      return;
    }

    setProcessing(true);
    setPaymentError('');

    try {
      payForm.submit();
    } catch (err) {
      console.error('Submit error:', err);
      setPaymentError('Failed to submit payment');
      setProcessing(false);
    }
  };

  const handlePaymentMethodChange = async (method: 'card' | 'bank') => {
    setPaymentMethod(method);
    setClientToken(null);
    setPayForm(null);
    if (paymentLink) {
      const total = calculateTotal();
      if (total > 0) {
        await getPaymentToken(paymentLink.organizationId, total, paymentLink.id);
      }
    }
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

  // Show success state
  if (paymentSuccess) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor }}>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <CheckCircle className="w-8 h-8" style={{ color: primaryColor }} />
            </div>
            <h3 className="text-2xl font-semibold mb-2">Payment Successful</h3>
            <p className="text-gray-500 mb-6">Thank you for your purchase.</p>
            <p className="text-4xl font-semibold mb-1" style={{ color: primaryColor }}>
              {formatCurrency(total)}
            </p>
            <p className="text-sm text-gray-500">
              A receipt has been sent to {email}
            </p>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="py-6 text-center">
          <a 
            href="https://lunarpay.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="text-sm">Powered by</span>
            <Image src="/logo.svg" alt="LunarPay" width={80} height={20} className="opacity-60 hover:opacity-100 transition-opacity" />
          </a>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor }}>
      <div className="flex-1 max-w-5xl mx-auto px-4 py-8 lg:py-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          
          {/* Left Column - Order Summary (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Merchant Info */}
            <div className="flex items-center gap-3">
              {paymentLink.organization.logo ? (
                <img 
                  src={paymentLink.organization.logo} 
                  alt={paymentLink.organization.name} 
                  className="h-10 w-10 rounded-lg object-contain" 
                />
              ) : (
                <div 
                  className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  {paymentLink.organization.name.charAt(0)}
                </div>
              )}
              <span className="font-medium text-gray-900">{paymentLink.organization.name}</span>
            </div>

            {/* Amount */}
            <div>
              <p className="text-4xl font-semibold text-gray-900 tracking-tight">
                {hasItems ? formatCurrency(total) : '$0.00'}
                {hasSubscription && subscriptionProduct && (
                  <span className="text-lg font-normal text-gray-500 ml-1">
                    {formatFrequency(subscriptionProduct.product.subscriptionInterval, subscriptionProduct.product.subscriptionIntervalCount)}
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {hasSubscription && subscriptionProduct?.product.subscriptionTrialDays 
                  ? `${subscriptionProduct.product.subscriptionTrialDays}-day free trial`
                  : hasItems ? 'Due today' : 'Select items below'
                }
              </p>
            </div>

            {/* Products */}
            <div className="border-t border-gray-200 pt-4 space-y-3">
              {paymentLink.products.length === 1 ? (
                // Single product - compact display
                <div className="flex justify-between text-sm">
                  <div className="text-gray-600">
                    <span>{paymentLink.products[0].product.name}</span>
                    {paymentLink.products[0].product.isSubscription && (
                      <span className="text-gray-400 ml-1">
                        {formatFrequency(paymentLink.products[0].product.subscriptionInterval, paymentLink.products[0].product.subscriptionIntervalCount)}
                      </span>
                    )}
                  </div>
                  <span className="text-gray-900 font-medium">
                    {formatCurrency(Number(paymentLink.products[0].product.price))}
                  </span>
                </div>
              ) : (
                // Multiple products - selectable with quantity
                paymentLink.products.map((item) => {
                  const quantity = cart[item.id] || 0;
                  const isAvailable = item.unlimited || (item.available !== null && item.available > 0);
                  const maxQty = item.unlimited ? 999 : (item.available || 0);

                  return (
                    <div 
                      key={item.id} 
                      className={`p-3 rounded-lg border transition-colors ${
                        quantity > 0 
                          ? 'border-gray-300 bg-gray-50' 
                          : 'border-gray-200 bg-white'
                      } ${!isAvailable ? 'opacity-50' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{item.product.name}</p>
                          {item.product.description && (
                            <p className="text-xs text-gray-500 line-clamp-1">{item.product.description}</p>
                          )}
                        </div>
                        <p className="text-sm font-medium ml-2" style={{ color: primaryColor }}>
                          {formatCurrency(Number(item.product.price))}
                          {item.product.isSubscription && (
                            <span className="text-gray-400 font-normal text-xs">
                              {formatFrequency(item.product.subscriptionInterval, item.product.subscriptionIntervalCount)}
                            </span>
                          )}
                        </p>
                      </div>
                      
                      {isAvailable ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="h-7 w-7 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 text-gray-600"
                            onClick={() => updateQuantity(item.id, -1)}
                            disabled={quantity === 0}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-sm font-medium">{quantity}</span>
                          <button
                            type="button"
                            className="h-7 w-7 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 text-gray-600"
                            onClick={() => updateQuantity(item.id, 1)}
                            disabled={quantity >= maxQty}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          {quantity > 0 && (
                            <span className="ml-auto text-sm font-medium">
                              {formatCurrency(Number(item.product.price) * quantity)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-red-500">Out of stock</p>
                      )}
                    </div>
                  );
                })
              )}
              
              {/* Total */}
              {hasItems && (
                <div className="flex justify-between pt-3 border-t border-gray-100">
                  <span className="font-medium text-gray-900">Total</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(total)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Payment Form (3 cols) */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none text-sm"
                    placeholder="you@example.com"
                  />
                </div>

                {/* Payment Method Tabs */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment method</label>
                  <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => handlePaymentMethodChange('card')}
                      className={`flex-1 py-2.5 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                        paymentMethod === 'card' 
                          ? 'bg-gray-900 text-white' 
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <CreditCard className="h-4 w-4" />
                      Card
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePaymentMethodChange('bank')}
                      className={`flex-1 py-2.5 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors border-l border-gray-300 ${
                        paymentMethod === 'bank' 
                          ? 'bg-gray-900 text-white' 
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Landmark className="h-4 w-4" />
                      Bank
                    </button>
                  </div>
                </div>

                {/* Fortis Elements Payment Form Container */}
                <div>
                  {!hasItems ? (
                    <div className="h-40 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                      <p className="text-gray-400 text-sm">Select items to continue</p>
                    </div>
                  ) : !clientToken || !fortisLoaded ? (
                    <div className="h-40 flex items-center justify-center bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="animate-spin h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full mx-auto mb-2" />
                        <p className="text-xs text-gray-500">Loading payment form...</p>
                      </div>
                    </div>
                  ) : (
                    <div id="payment-form-container" className="min-h-[180px]" />
                  )}
                  
                  {paymentError && (
                    <p className="text-red-500 text-sm mt-2">{paymentError}</p>
                  )}
                </div>

                {/* Save Payment Method */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={savePaymentMethod}
                    onChange={(e) => setSavePaymentMethod(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span className="text-sm text-gray-600">Save payment method for future use</span>
                </label>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={processing || !hasItems || !clientToken || !fortisLoaded}
                  className="w-full py-3 rounded-lg font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: primaryColor, color: buttonTextColor }}
                >
                  {processing 
                    ? 'Processing...' 
                    : !hasItems 
                      ? 'Select items to continue'
                      : hasSubscription 
                        ? `Subscribe — ${formatCurrency(total)}` 
                        : `Pay ${formatCurrency(total)}`
                  }
                </button>

                {/* Terms & Security */}
                <div className="space-y-2 pt-2">
                  <p className="text-xs text-gray-400 text-center leading-relaxed">
                    By paying, you agree to {paymentLink.organization.name}&apos;s terms{hasSubscription ? ' and authorize recurring charges' : ''}.
                  </p>
                  <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                    <Lock className="h-3 w-3" />
                    Secured with 256-bit SSL encryption
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="py-6 text-center">
        <a 
          href="https://lunarpay.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <span className="text-sm">Powered by</span>
          <Image src="/logo.svg" alt="LunarPay" width={80} height={20} className="opacity-60 hover:opacity-100 transition-opacity" />
        </a>
      </footer>
    </div>
  );
}
