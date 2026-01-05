'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { FileText, Download, CreditCard, Landmark, Lock, CheckCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Invoice {
  id: number;
  status: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string | null;
  invoiceDate: string | null;
  reference: string | null;
  memo: string | null;
  pdfUrl: string | null;
  hash: string;
  organizationId: number;
  organization: {
    name: string;
    logo: string | null;
    email: string | null;
    phoneNumber: string | null;
    primaryColor: string | null;
    backgroundColor: string | null;
    buttonTextColor: string | null;
  };
  donor: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
  products: Array<{
    productName: string;
    qty: number;
    price: number;
    subtotal: number;
    product?: {
      isSubscription: boolean;
      subscriptionInterval: string | null;
      subscriptionIntervalCount: number | null;
      subscriptionTrialDays: number | null;
    } | null;
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

export default function PublicInvoicePage() {
  const params = useParams();
  const hash = params?.hash as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank'>('card');
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  
  // Form state
  const [email, setEmail] = useState('');
  const [savePaymentMethod, setSavePaymentMethod] = useState(false);
  
  // Fortis Elements state
  const [clientToken, setClientToken] = useState<string | null>(null);
  const [fortisLoaded, setFortisLoaded] = useState(false);
  const [payForm, setPayForm] = useState<any>(null);

  // Branding colors with defaults
  const primaryColor = invoice?.organization?.primaryColor || '#000000';
  const backgroundColor = invoice?.organization?.backgroundColor || '#f8fafc';
  const buttonTextColor = invoice?.organization?.buttonTextColor || '#ffffff';

  useEffect(() => {
    fetchInvoice();
  }, [hash]);

  // Load Fortis Elements script
  useEffect(() => {
    if (!invoice) return;
    
    // Check if already loaded
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
  }, [invoice]);

  // Initialize Fortis payment form when token is available
  useEffect(() => {
    if (!clientToken || !fortisLoaded || !window.PayForm) return;

    try {
      // Configure payment form
      const config = {
        container: '#payment-form-container',
        theme: 'default',
        environment: 'sandbox', // Will be overridden by token
        floatingLabels: true,
        showReceipt: false,
        showSubmitButton: false, // We'll use our own button
        fields: paymentMethod === 'card' 
          ? ['account_holder_name', 'account_number', 'exp_date', 'cvv']
          : ['account_holder_name', 'routing_number', 'account_number', 'account_type'],
        submitButton: {
          className: 'hidden',
        },
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

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/public/${hash}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invoice not found');
      }

      setInvoice(data.invoice);
      // Pre-fill email if available
      if (data.invoice.donor?.email) {
        setEmail(data.invoice.donor.email);
      }

      // Get transaction intention token
      await getPaymentToken(data.invoice.organizationId, data.invoice.totalAmount - data.invoice.paidAmount, data.invoice.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentToken = async (orgId: number, amount: number, invoiceId: number) => {
    try {
      const response = await fetch('/api/public/fortis/transaction-intention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: orgId,
          amount,
          action: 'sale',
          type: 'invoice',
          referenceId: invoiceId,
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

  const processPayment = async (fortisResponse: any) => {
    if (!invoice) return;

    try {
      const response = await fetch('/api/public/fortis/process-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'invoice',
          referenceId: invoice.id,
          organizationId: invoice.organizationId,
          customerId: invoice.donor?.id,
          customerEmail: email,
          fortisResponse,
          savePaymentMethod,
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

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!payForm) {
      setPaymentError('Payment form not ready');
      return;
    }

    setProcessing(true);
    setPaymentError('');

    try {
      // Submit the Fortis payment form
      payForm.submit();
    } catch (err) {
      console.error('Submit error:', err);
      setPaymentError('Failed to submit payment');
      setProcessing(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      window.open(`/api/invoices/public/${hash}/pdf`, '_blank');
    } catch (error) {
      console.error('Failed to download PDF:', error);
    }
  };

  // Handle payment method change - need new token
  const handlePaymentMethodChange = async (method: 'card' | 'bank') => {
    setPaymentMethod(method);
    setClientToken(null);
    setPayForm(null);
    if (invoice) {
      const amountDue = Number(invoice.totalAmount) - Number(invoice.paidAmount);
      await getPaymentToken(invoice.organizationId, amountDue, invoice.id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-black border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 px-4">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold mb-2">Invoice Not Found</h2>
          <p className="text-gray-500">{error || 'This invoice does not exist or has been removed.'}</p>
        </div>
      </div>
    );
  }

  const isPaid = invoice.status === 'paid';
  const amountDue = Number(invoice.totalAmount) - Number(invoice.paidAmount);
  
  // Check if any product is a subscription
  const hasSubscription = invoice.products.some(p => p.product?.isSubscription);
  const subscriptionProduct = invoice.products.find(p => p.product?.isSubscription);

  // Show success state
  if (paymentSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor }}>
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full text-center">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <CheckCircle className="w-10 h-10" style={{ color: primaryColor }} />
          </div>
          <h3 className="text-2xl font-bold mb-2">Payment Successful!</h3>
          <p className="text-gray-500 mb-6">Thank you for your payment.</p>
          <p className="text-3xl font-bold mb-2" style={{ color: primaryColor }}>
            {formatCurrency(amountDue)}
          </p>
          <p className="text-sm text-gray-500 mb-6">
            A receipt has been sent to {email}
          </p>
          
          <button 
            onClick={handleDownloadPDF}
            className="w-full py-3 rounded-lg font-medium border-2 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
            style={{ borderColor: primaryColor, color: primaryColor }}
          >
            <Download className="h-5 w-5" />
            Download Receipt
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor }}>
      <div className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          
          {/* Left Column - Invoice Details */}
          <div className="space-y-6">
            {/* Logo/Brand */}
            <div>
              {invoice.organization.logo ? (
                <img 
                  src={invoice.organization.logo} 
                  alt={invoice.organization.name} 
                  className="h-12 object-contain" 
                />
              ) : (
                <h2 
                  className="text-2xl font-bold tracking-tight"
                  style={{ color: primaryColor }}
                >
                  {invoice.organization.name.toUpperCase()}
                </h2>
              )}
            </div>

            {/* Pay To */}
            <p className="text-gray-600">
              Pay to <span className="font-medium text-gray-900">{invoice.organization.name}</span>
            </p>

            {/* Amount */}
            <div>
              <p className="text-5xl font-light text-gray-900">
                {formatCurrency(amountDue)}
                {hasSubscription && subscriptionProduct?.product && (
                  <span className="text-xl text-gray-500 ml-2">
                    {formatFrequency(subscriptionProduct.product.subscriptionInterval, subscriptionProduct.product.subscriptionIntervalCount)}
                  </span>
                )}
              </p>
              <p className="text-gray-500 mt-1">
                {hasSubscription && subscriptionProduct?.product?.subscriptionTrialDays 
                  ? `${subscriptionProduct.product.subscriptionTrialDays} day trial`
                  : invoice.dueDate 
                    ? `Due ${formatDate(invoice.dueDate)}` 
                    : 'Due today'
                }
              </p>
            </div>

            {/* Divider */}
            <hr className="border-gray-200" />

            {/* Line Items */}
            <div className="space-y-4">
              {invoice.products.map((product, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{product.productName}</p>
                    {product.qty > 1 && (
                      <p className="text-sm text-gray-500">Qty: {product.qty} × {formatCurrency(Number(product.price))}</p>
                    )}
                    {product.product?.isSubscription && product.product.subscriptionTrialDays && (
                      <p className="text-sm text-gray-500">({product.product.subscriptionTrialDays} days trial)</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatCurrency(Number(product.subtotal))}
                    </p>
                    {product.product?.isSubscription && (
                      <p className="text-xs text-gray-500">
                        {formatFrequency(product.product.subscriptionInterval, product.product.subscriptionIntervalCount)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              
              <hr className="border-gray-100" />
              
              {/* Total */}
              <div className="flex justify-between items-center pt-2">
                <p className="font-medium text-gray-900">Total</p>
                <p className="text-xl font-bold" style={{ color: primaryColor }}>
                  {formatCurrency(Number(invoice.totalAmount))}
                </p>
              </div>
              
              {Number(invoice.paidAmount) > 0 && (
                <>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <p>Amount Paid</p>
                    <p>-{formatCurrency(Number(invoice.paidAmount))}</p>
                  </div>
                  <div className="flex justify-between items-center font-bold">
                    <p>Amount Due</p>
                    <p style={{ color: primaryColor }}>{formatCurrency(amountDue)}</p>
                  </div>
                </>
              )}
            </div>

            {/* Download PDF Link */}
            <button 
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 text-sm font-medium hover:underline"
              style={{ color: primaryColor }}
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>

            {/* Footer */}
            <div className="pt-8 mt-auto">
              <p className="text-sm text-gray-400 flex items-center gap-2">
                Powered by <span className="font-semibold text-gray-600">Lunar<span style={{ color: primaryColor }}>Pay</span></span>
              </p>
            </div>
          </div>

          {/* Right Column - Payment Form */}
          {!isPaid && amountDue > 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-6 lg:p-8 h-fit">
              <form onSubmit={handlePayment} className="space-y-6">
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
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handlePaymentMethodChange('card')}
                      className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                        paymentMethod === 'card' 
                          ? 'border-black bg-gray-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <CreditCard className="h-6 w-6" />
                      <span className="text-xs font-medium">Card</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePaymentMethodChange('bank')}
                      className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                        paymentMethod === 'bank' 
                          ? 'border-black bg-gray-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Landmark className="h-6 w-6" />
                      <span className="text-xs font-medium">Bank</span>
                    </button>
                  </div>
                </div>

                {/* Fortis Elements Payment Form Container */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Info</h3>
                  
                  {!clientToken || !fortisLoaded ? (
                    <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="animate-spin h-6 w-6 border-2 border-black border-t-transparent rounded-full mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Loading secure payment form...</p>
                      </div>
                    </div>
                  ) : (
                    <div id="payment-form-container" className="min-h-[200px]" />
                  )}
                  
                  {paymentError && (
                    <p className="text-red-500 text-sm mt-2">{paymentError}</p>
                  )}
                </div>

                {/* Save Payment Method */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="savePayment"
                    checked={savePaymentMethod}
                    onChange={(e) => setSavePaymentMethod(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor="savePayment" className="text-sm text-gray-600">
                    Save payment method for future use
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={processing || !clientToken || !fortisLoaded}
                  className="w-full py-4 rounded-lg font-medium text-lg transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: primaryColor, color: buttonTextColor }}
                >
                  {processing 
                    ? 'Processing...' 
                    : hasSubscription 
                      ? 'Subscribe' 
                      : `Pay ${formatCurrency(amountDue)}`
                  }
                </button>

                {/* Terms */}
                <p className="text-xs text-gray-500 text-center leading-relaxed">
                  By clicking on &ldquo;{hasSubscription ? 'Subscribe' : 'Pay'}&rdquo;, you agree to allow {invoice.organization.name} to charge your card for this payment{hasSubscription ? ' and future payments according to the payment frequency listed' : ''}.
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
          ) : (
            /* Paid Status Card */
            <div className="bg-white rounded-lg shadow-sm p-6 lg:p-8 h-fit text-center">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <svg className="w-10 h-10" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2">Invoice Paid</h3>
              <p className="text-gray-500 mb-6">This invoice has been paid in full.</p>
              <p className="text-3xl font-bold mb-2" style={{ color: primaryColor }}>
                {formatCurrency(Number(invoice.totalAmount))}
              </p>
              <p className="text-sm text-gray-500">Thank you for your payment!</p>
              
              <button 
                onClick={handleDownloadPDF}
                className="mt-6 w-full py-3 rounded-lg font-medium border-2 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                style={{ borderColor: primaryColor, color: primaryColor }}
              >
                <Download className="h-5 w-5" />
                Download Receipt
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
