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
    Commerce?: {
      elements: new (token: string) => {
        create: (config: any) => void;
        on: (event: string, callback: (data?: any) => void) => void;
        submit: () => void;
      };
    };
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
  const [demoMode, setDemoMode] = useState(false);
  const [fortisEnvironment, setFortisEnvironment] = useState<'sandbox' | 'production'>('production');
  
  // Demo form state (for screenshot/preview when Fortis not configured)
  const [demoCardNumber, setDemoCardNumber] = useState('');
  const [demoExpiry, setDemoExpiry] = useState('');
  const [demoCvc, setDemoCvc] = useState('');
  const [demoAccountNumber, setDemoAccountNumber] = useState('');
  const [demoRoutingNumber, setDemoRoutingNumber] = useState('');

  // Branding colors with defaults
  const primaryColor = paymentLink?.organization?.primaryColor || '#000000';
  const backgroundColor = paymentLink?.organization?.backgroundColor || '#f8fafc';
  const buttonTextColor = paymentLink?.organization?.buttonTextColor || '#ffffff';

  useEffect(() => {
    fetchPaymentLink();
  }, [hash]);

  // Load Fortis Elements script based on environment
  // Only load after we have the token and know the environment
  useEffect(() => {
    // Don't load script until we have the token (which tells us the environment)
    if (!paymentLink || !clientToken) return;
    
    if (window.Commerce?.elements) {
      console.log('[Fortis] Commerce.elements already loaded');
      setFortisLoaded(true);
      return;
    }

    // Use environment-specific script URL
    // Production uses js.fortis.tech, sandbox uses js.sandbox.fortis.tech
    const scriptUrl = fortisEnvironment === 'production'
      ? 'https://js.fortis.tech/commercejs-v1.0.0.min.js'
      : 'https://js.sandbox.fortis.tech/commercejs-v1.0.0.min.js';
    
    console.log('[Fortis] Loading script for environment:', fortisEnvironment, scriptUrl);

    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;
    script.onload = () => {
      console.log('[Fortis] Script loaded, Commerce available:', !!window.Commerce);
      setFortisLoaded(true);
    };
    script.onerror = () => {
      console.error('[Fortis] Failed to load script');
      setDemoMode(true);
    };
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [paymentLink, clientToken, fortisEnvironment]);

  // Calculate total
  const calculateTotal = () => {
    if (!paymentLink) return 0;
    return paymentLink.products.reduce((sum, item) => {
      const qty = cart[item.id] || 0;
      return sum + (Number(item.product.price) * qty);
    }, 0);
  };

  // Initialize Fortis payment form when token and total are ready
  // Based on working ShoutOutUS implementation
  useEffect(() => {
    if (!clientToken || !fortisLoaded || !window.Commerce?.elements) {
      console.log('[Fortis] Not ready:', { clientToken: !!clientToken, fortisLoaded, hasCommerce: !!window.Commerce?.elements });
      return;
    }

    console.log('[Fortis] Initializing Commerce.elements with environment:', fortisEnvironment);

    try {
      // Create elements instance with the token
      // Cast to any since Commerce.js is dynamically loaded
      const elements: any = new (window as any).Commerce.elements(clientToken);
      
      // Handle success events - use eventBus like ShoutOutUS
      const handleSuccess = async (payload: any) => {
        console.log('[Fortis] payment_success payload:', payload);
        const txId = payload?.transaction?.id || payload?.data?.id || payload?.id;
        if (!txId) {
          console.warn('[Fortis] No transaction ID in payload');
          return;
        }
        await processPayment(payload);
      };

      // Attach event handlers using eventBus (like ShoutOutUS)
      // Events must be attached BEFORE create()
      if (elements.eventBus) {
        elements.eventBus.on('ready', () => {
          console.log('[Fortis] Payment form ready');
        });
        
        elements.eventBus.on('payment_success', handleSuccess);
        elements.eventBus.on('success', handleSuccess);
        elements.eventBus.on('done', handleSuccess);
        
        elements.eventBus.on('payment_error', (err: any) => {
          console.error('[Fortis] payment_error:', err);
          setPaymentError(err?.message || 'Payment failed. Please try again.');
          setProcessing(false);
        });
        
        elements.eventBus.on('error', (err: any) => {
          console.error('[Fortis] error:', err);
          setPaymentError(err?.message || 'Payment form error');
        });
      } else {
        // Fallback to elements.on() if eventBus not available
        console.log('[Fortis] Using elements.on() fallback');
        elements.on('ready', () => console.log('[Fortis] Payment form ready'));
        elements.on('done', handleSuccess);
        elements.on('error', (err: any) => setPaymentError(err?.message || 'Payment form error'));
      }
      
      // Create the payment form with explicit environment and custom styling
      elements.create({
        container: '#payment-form-container',
        theme: 'default',
        environment: 'production', // Explicitly set production like ShoutOutUS
        view: 'default',
        language: 'en-us',
        defaultCountry: 'US',
        floatingLabels: true,
        showReceipt: false,
        showSubmitButton: false,
        showValidationAnimation: true,
        hideTotal: true,
        hideAgreementCheckbox: true,
        hideSaveCardOption: true,
        appearance: {
          // Primary button colors (Credit Card/ACH selector when selected)
          colorButtonSelectedBackground: primaryColor,
          colorButtonSelectedText: buttonTextColor,
          colorButtonText: '#4a5568',
          colorButtonBackground: '#f7fafc',
          // Input styling
          colorPrimary: primaryColor,
          colorBackground: '#ffffff',
          colorText: '#1a202c',
          colorTextSecondary: '#718096',
          colorDanger: '#e53e3e',
          // Border and focus states
          colorBorder: '#e2e8f0',
          colorBorderFocus: primaryColor,
          // Font settings
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: '16px',
          fontWeightNormal: '400',
          fontWeightBold: '600',
          // Border radius for rounded corners
          borderRadius: '8px',
          // Spacing
          spacingUnit: '4px',
        },
        // Custom CSS injection for fine-tuned styling
        css: `
          .fortis-input {
            border-radius: 8px !important;
            border: 1px solid #e2e8f0 !important;
            padding: 12px 16px !important;
            font-size: 16px !important;
            transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
          }
          .fortis-input:focus {
            border-color: ${primaryColor} !important;
            box-shadow: 0 0 0 3px ${primaryColor}20 !important;
            outline: none !important;
          }
          .fortis-label {
            color: #4a5568 !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            margin-bottom: 6px !important;
          }
          .fortis-button {
            border-radius: 8px !important;
            font-weight: 500 !important;
            transition: all 0.2s ease !important;
          }
          .fortis-button.selected {
            background-color: ${primaryColor} !important;
            color: ${buttonTextColor} !important;
          }
          .fortis-error {
            color: #e53e3e !important;
            font-size: 13px !important;
          }
        `,
      });

      setPayForm(elements);
    } catch (err) {
      console.error('[Fortis] Init error:', err);
      setPaymentError('Failed to initialize payment form');
    }
  }, [clientToken, fortisLoaded, paymentMethod, primaryColor, buttonTextColor, fortisEnvironment]);

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
        setFortisEnvironment(data.environment === 'production' ? 'production' : 'sandbox');
        setDemoMode(false);
        console.log('[PaymentLink] Got Fortis token, environment:', data.environment);
      } else {
        // Enable demo mode for screenshots/preview when Fortis not configured
        console.log('[PaymentLink] Enabling demo mode - Fortis not configured');
        setDemoMode(true);
        setPaymentError('');
      }
    } catch (err) {
      console.error('Token error:', err);
      // Enable demo mode on error
      setDemoMode(true);
      setPaymentError('');
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

  // Auto-initialize cart for single products
  useEffect(() => {
    if (!paymentLink) return;
    if (paymentLink.products.length === 1) {
      const item = paymentLink.products[0];
      const isUnlimited = item.unlimited || item.unlimitedQty;
      const isAvailable = isUnlimited || (item.available !== null && item.available > 0);
      if (isAvailable && !cart[item.id]) {
        setCart({ [item.id]: 1 });
      }
    }
  }, [paymentLink]);

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
    
    // Demo mode - show preview message
    if (demoMode) {
      setPaymentError('Demo mode - Payment processing not available. Please contact merchant to complete setup.');
      return;
    }
    
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
            <span className="text-xs">Powered by</span>
            <Image src="/logo.png" alt="LunarPay" width={50} height={14} className="opacity-60 hover:opacity-100 transition-opacity" />
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
            <div className="space-y-2">
              {paymentLink.organization.logo ? (
                <img 
                  src={paymentLink.organization.logo} 
                  alt={paymentLink.organization.name} 
                  className="h-12 w-auto max-w-[200px] object-contain" 
                />
              ) : (
                <div 
                  className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                  style={{ backgroundColor: primaryColor }}
                >
                  {paymentLink.organization.name.charAt(0)}
                </div>
              )}
              <p className="text-gray-600 text-sm">Pay <span className="font-medium text-gray-900">{paymentLink.organization.name}</span> easily.</p>
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

            {/* Payment Link Title */}
            {paymentLink.name && (
              <div className="border-t border-gray-200 pt-4">
                <h2 className="font-semibold text-gray-900">{paymentLink.name}</h2>
                {paymentLink.description && (
                  <p className="text-sm text-gray-500 mt-1">{paymentLink.description}</p>
                )}
              </div>
            )}

            {/* Products */}
            <div className={`${paymentLink.name ? 'pt-3' : 'border-t border-gray-200 pt-4'} space-y-3`}>
              {paymentLink.products.length === 1 ? (
                // Single product display
                (() => {
                  const item = paymentLink.products[0];
                  const quantity = cart[item.id] || 1;
                  // Check both unlimited and unlimitedQty flags
                  const isUnlimited = item.unlimited || item.unlimitedQty;
                  const isAvailable = isUnlimited || (item.available !== null && item.available > 0);
                  const maxQty = isUnlimited ? 999 : (item.available || 1);
                  // Allow multiple for unlimited products OR products with available > 1
                  const allowMultiple = isUnlimited || (item.available !== null && item.available > 1);
                  
                  return (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <div className="text-gray-600">
                          <span>{item.product.name}</span>
                          {item.product.isSubscription && (
                            <span className="text-gray-400 ml-1">
                              {formatFrequency(item.product.subscriptionInterval, item.product.subscriptionIntervalCount)}
                            </span>
                          )}
                        </div>
                        <span className="text-gray-900 font-medium">
                          {formatCurrency(Number(item.product.price))}
                          {quantity > 1 && <span className="text-gray-500 font-normal"> each</span>}
                        </span>
                      </div>
                      
                      {/* Quantity selector for unlimited/multi-qty products */}
                      {(allowMultiple || isUnlimited) && (
                        <div 
                          className="flex items-center justify-between rounded-lg p-3"
                          style={{ backgroundColor: `${primaryColor}08` }}
                        >
                          <span className="text-sm text-gray-600">Quantity</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, -1)}
                              className="h-9 w-9 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
                              style={{ 
                                backgroundColor: quantity <= 1 ? '#e5e7eb' : primaryColor,
                                color: quantity <= 1 ? '#9ca3af' : buttonTextColor 
                              }}
                              disabled={quantity <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              max={maxQty}
                              value={quantity}
                              onChange={(e) => {
                                const val = Math.max(1, Math.min(maxQty, parseInt(e.target.value) || 1));
                                setCart({ [item.id]: val });
                              }}
                              className="w-14 text-center text-sm font-semibold border-2 rounded-lg py-2 outline-none transition-colors"
                              style={{ 
                                borderColor: `${primaryColor}40`,
                              }}
                              onFocus={(e) => e.target.style.borderColor = primaryColor}
                              onBlur={(e) => e.target.style.borderColor = `${primaryColor}40`}
                            />
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, 1)}
                              className="h-9 w-9 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
                              style={{ 
                                backgroundColor: quantity >= maxQty ? '#e5e7eb' : primaryColor,
                                color: quantity >= maxQty ? '#9ca3af' : buttonTextColor 
                              }}
                              disabled={quantity >= maxQty}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* Total for multiple items */}
                      {quantity > 1 && (
                        <div className="flex justify-between text-sm pt-3 mt-1 border-t border-gray-200">
                          <span className="text-gray-600">Total ({quantity} items)</span>
                          <span className="font-semibold" style={{ color: primaryColor }}>
                            {formatCurrency(Number(item.product.price) * quantity)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                // Multiple products - selectable with quantity
                paymentLink.products.map((item) => {
                  const quantity = cart[item.id] || 0;
                  const isUnlimited = item.unlimited || item.unlimitedQty;
                  const isAvailable = isUnlimited || (item.available !== null && item.available > 0);
                  const maxQty = isUnlimited ? 999 : (item.available || 0);

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

                {/* Payment Form Container */}
                <div>
                  {!hasItems ? (
                    <div className="h-40 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                      <p className="text-gray-400 text-sm">Select items to continue</p>
                    </div>
                  ) : demoMode ? (
                    /* Demo Mode - Simple card fields for screenshots */
                    paymentMethod === 'card' ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Card number</label>
                          <input
                            type="text"
                            value={demoCardNumber}
                            onChange={(e) => setDemoCardNumber(e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                            maxLength={19}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none text-sm"
                            placeholder="1234 5678 9012 3456"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Expiry</label>
                            <input
                              type="text"
                              value={demoExpiry}
                              onChange={(e) => {
                                let val = e.target.value.replace(/\D/g, '');
                                if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2, 4);
                                setDemoExpiry(val);
                              }}
                              maxLength={5}
                              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none text-sm"
                              placeholder="MM/YY"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">CVC</label>
                            <input
                              type="text"
                              value={demoCvc}
                              onChange={(e) => setDemoCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                              maxLength={4}
                              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none text-sm"
                              placeholder="123"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Routing number</label>
                          <input
                            type="text"
                            value={demoRoutingNumber}
                            onChange={(e) => setDemoRoutingNumber(e.target.value.replace(/\D/g, '').slice(0, 9))}
                            maxLength={9}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none text-sm"
                            placeholder="110000000"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Account number</label>
                          <input
                            type="text"
                            value={demoAccountNumber}
                            onChange={(e) => setDemoAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 17))}
                            maxLength={17}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none text-sm"
                            placeholder="000123456789"
                          />
                        </div>
                      </div>
                    )
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
                  disabled={processing || !hasItems || (!demoMode && (!clientToken || !fortisLoaded || !payForm))}
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
          <span className="text-xs">Powered by</span>
          <Image src="/logo.png" alt="LunarPay" width={50} height={14} className="opacity-60 hover:opacity-100 transition-opacity" />
        </a>
      </footer>
    </div>
  );
}
