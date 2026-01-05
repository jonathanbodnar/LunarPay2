'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { FileText, Download, CreditCard, Landmark, Lock, CheckCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import Image from 'next/image';

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
            <p className="text-gray-500 mb-6">Thank you for your payment.</p>
            <p className="text-4xl font-semibold mb-1" style={{ color: primaryColor }}>
              {formatCurrency(amountDue)}
            </p>
            <p className="text-sm text-gray-500 mb-8">
              A receipt has been sent to {email}
            </p>
            
            <button 
              onClick={handleDownloadPDF}
              className="w-full py-3 rounded-lg font-medium border flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
              style={{ borderColor: primaryColor, color: primaryColor }}
            >
              <Download className="h-4 w-4" />
              Download Receipt
            </button>
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
            <Image src="/logo.png" alt="LunarPay" width={100} height={28} className="opacity-70 hover:opacity-100 transition-opacity" />
          </a>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor }}>
      <div className="flex-1 max-w-5xl mx-auto px-4 py-8 lg:py-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          
          {/* Left Column - Invoice Summary (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Merchant Info */}
            <div className="flex items-center gap-4">
              {invoice.organization.logo ? (
                <img 
                  src={invoice.organization.logo} 
                  alt={invoice.organization.name} 
                  className="h-14 w-auto max-w-[180px] object-contain" 
                />
              ) : (
                <div 
                  className="h-14 w-14 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                  style={{ backgroundColor: primaryColor }}
                >
                  {invoice.organization.name.charAt(0)}
                </div>
              )}
              <span className="font-semibold text-gray-900 text-lg">{invoice.organization.name}</span>
            </div>

            {/* Amount Due */}
            <div>
              <p className="text-4xl font-semibold text-gray-900 tracking-tight">
                {formatCurrency(amountDue)}
                {hasSubscription && subscriptionProduct?.product && (
                  <span className="text-lg font-normal text-gray-500 ml-1">
                    {formatFrequency(subscriptionProduct.product.subscriptionInterval, subscriptionProduct.product.subscriptionIntervalCount)}
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {hasSubscription && subscriptionProduct?.product?.subscriptionTrialDays 
                  ? `${subscriptionProduct.product.subscriptionTrialDays}-day free trial`
                  : invoice.dueDate 
                    ? `Due ${formatDate(invoice.dueDate)}` 
                    : 'Due today'
                }
              </p>
            </div>

            {/* Line Items - Compact */}
            <div className="border-t border-gray-200 pt-4 space-y-3">
              {invoice.products.map((product, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <div className="text-gray-600">
                    <span>{product.productName}</span>
                    {product.qty > 1 && <span className="text-gray-400 ml-1">× {product.qty}</span>}
                    {product.product?.isSubscription && (
                      <span className="text-gray-400 ml-1">
                        {formatFrequency(product.product.subscriptionInterval, product.product.subscriptionIntervalCount)}
                      </span>
                    )}
                  </div>
                  <span className="text-gray-900 font-medium">{formatCurrency(Number(product.subtotal))}</span>
                </div>
              ))}
              
              {/* Total */}
              <div className="flex justify-between pt-3 border-t border-gray-100">
                <span className="font-medium text-gray-900">Total due</span>
                <span className="font-semibold text-gray-900">{formatCurrency(amountDue)}</span>
              </div>
            </div>

            {/* Download PDF */}
            <button 
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Download invoice
            </button>
          </div>

          {/* Right Column - Payment Form (3 cols) */}
          {!isPaid && amountDue > 0 ? (
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8">
                <form onSubmit={handlePayment} className="space-y-5">
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
                    {!clientToken || !fortisLoaded ? (
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
                    disabled={processing || !clientToken || !fortisLoaded}
                    className="w-full py-3 rounded-lg font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: primaryColor, color: buttonTextColor }}
                  >
                    {processing 
                      ? 'Processing...' 
                      : hasSubscription 
                        ? `Subscribe — ${formatCurrency(amountDue)}` 
                        : `Pay ${formatCurrency(amountDue)}`
                    }
                  </button>

                  {/* Terms & Security */}
                  <div className="space-y-2 pt-2">
                    <p className="text-xs text-gray-400 text-center leading-relaxed">
                      By paying, you agree to {invoice.organization.name}&apos;s terms{hasSubscription ? ' and authorize recurring charges' : ''}.
                    </p>
                    <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                      <Lock className="h-3 w-3" />
                      Secured with 256-bit SSL encryption
                    </p>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            /* Paid Status Card */
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 text-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <CheckCircle className="w-8 h-8" style={{ color: primaryColor }} />
                </div>
                <h3 className="text-xl font-semibold mb-2">Invoice Paid</h3>
                <p className="text-gray-500 mb-4">This invoice has been paid in full.</p>
                <p className="text-3xl font-semibold mb-6" style={{ color: primaryColor }}>
                  {formatCurrency(Number(invoice.totalAmount))}
                </p>
                
                <button 
                  onClick={handleDownloadPDF}
                  className="w-full py-3 rounded-lg font-medium border flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                  style={{ borderColor: primaryColor, color: primaryColor }}
                >
                  <Download className="h-4 w-4" />
                  Download Receipt
                </button>
              </div>
            </div>
          )}
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
          <Image src="/logo.png" alt="LunarPay" width={100} height={28} className="opacity-70 hover:opacity-100 transition-opacity" />
        </a>
      </footer>
    </div>
  );
}
