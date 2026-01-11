'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { FileText, Download, CreditCard, Landmark, Lock, CheckCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import '@/types/global';
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
  const [demoMode, setDemoMode] = useState(false);
  const [fortisEnvironment, setFortisEnvironment] = useState<'sandbox' | 'production'>('production');
  const [intentionType, setIntentionType] = useState<'transaction' | 'ticket'>('transaction');
  const [ticketAmount, setTicketAmount] = useState<number>(0);
  
  // Demo form state (for screenshot/preview when Fortis not configured)
  const [demoCardNumber, setDemoCardNumber] = useState('');
  const [demoExpiry, setDemoExpiry] = useState('');
  const [demoCvc, setDemoCvc] = useState('');
  const [demoAccountNumber, setDemoAccountNumber] = useState('');
  const [demoRoutingNumber, setDemoRoutingNumber] = useState('');

  // Branding colors with defaults
  const primaryColor = invoice?.organization?.primaryColor || '#000000';
  const backgroundColor = invoice?.organization?.backgroundColor || '#f8fafc';
  const buttonTextColor = invoice?.organization?.buttonTextColor || '#ffffff';

  useEffect(() => {
    fetchInvoice();
  }, [hash]);

  // Load Fortis Elements script based on environment
  // Only load after we have the token and know the environment
  useEffect(() => {
    // Don't load script until we have the token (which tells us the environment)
    if (!invoice || !clientToken) return;
    
    // Check if already loaded
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
  }, [invoice, clientToken, fortisEnvironment]);

  // Initialize Fortis payment form when token is available
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
      
      // Create the payment form with explicit environment
      elements.create({
        container: '#payment-form-container',
        theme: 'default',
        environment: fortisEnvironment, // Use the environment from the API response
        view: 'default',
        language: 'en-us',
        defaultCountry: 'US',
        floatingLabels: true,
        showReceipt: false,
        showSubmitButton: false,
        showValidationAnimation: true,
        hideTotal: true,
        hideAgreementCheckbox: true,
        appearance: {
          // Only use Fortis-supported appearance options
          colorButtonSelectedBackground: primaryColor,
          colorButtonSelectedText: buttonTextColor,
          colorButtonText: '#4a5568',
          colorButtonBackground: '#f7fafc',
          colorBackground: '#ffffff',
          colorText: '#1a202c',
          // fontFamily must be one of: Roboto, Montserrat, OpenSans, Raleway, SourceCode, SourceSans
          fontFamily: 'Roboto',
          fontSize: '16px',
          borderRadius: '8px',
        },
      });

      setPayForm(elements);
    } catch (err) {
      console.error('[Fortis] Init error:', err);
      setPaymentError('Failed to initialize payment form');
    }
  }, [clientToken, fortisLoaded, paymentMethod, primaryColor, buttonTextColor, fortisEnvironment]);

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

      // Auto-check save card if invoice contains subscription
      const hasSubscription = data.invoice.products.some((p: any) => p.product?.isSubscription);
      if (hasSubscription) {
        setSavePaymentMethod(true);
      }

      // Get transaction intention token - pass invoice data explicitly for subscription detection
      await getPaymentToken(
        data.invoice.organizationId, 
        data.invoice.totalAmount - data.invoice.paidAmount, 
        data.invoice.id,
        data.invoice // Pass invoice data explicitly since state update is async
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentToken = async (orgId: number, amount: number, invoiceId: number, currentInvoice?: Invoice) => {
    // Use passed invoice data if available (for initial load when state hasn't updated yet)
    const invoiceData = currentInvoice || invoice;
    
    // Check if any product is a subscription - need ticket intention for card saving
    const hasSubscription = invoiceData?.products.some(p => p.product?.isSubscription) || false;
    const shouldSaveCard = hasSubscription || savePaymentMethod;
    
    console.log('[Invoice] getPaymentToken:', {
      amount,
      hasSubscription,
      shouldSaveCard,
    });
    
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
          savePaymentMethod: shouldSaveCard,
          hasRecurring: hasSubscription, // Use ticket intention for subscriptions
        }),
      });

      const data = await response.json();
      
      if (data.success && data.clientToken) {
        setClientToken(data.clientToken);
        setFortisEnvironment(data.environment === 'production' ? 'production' : 'sandbox');
        setIntentionType(data.intentionType || 'transaction');
        setTicketAmount(data.amount || Math.round(amount * 100));
        setDemoMode(false);
        console.log('[Invoice] Got Fortis token:', {
          environment: data.environment,
          intentionType: data.intentionType,
          hasSubscription,
        });
      } else {
        // Enable demo mode for screenshots/preview when Fortis not configured
        console.log('[Invoice] Enabling demo mode - Fortis not configured');
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

  const processPayment = async (fortisResponse: any) => {
    if (!invoice) return;

    // Check if any product is a subscription
    const hasSubscriptionProduct = invoice.products.some(p => p.product?.isSubscription);
    const shouldSavePaymentMethod = hasSubscriptionProduct || savePaymentMethod;

    console.log('[Invoice] Processing payment:', {
      intentionType,
      hasSubscriptionProduct,
      fortisResponse: fortisResponse ? 'present' : 'missing',
    });

    // Build products array with subscription info
    const productsToProcess = invoice.products.map((product, index) => ({
      id: index, // Use index as fallback ID
      productName: product.productName,
      productPrice: Number(product.price),
      qtyReq: product.qty,
      isSubscription: product.product?.isSubscription || false,
      subscriptionInterval: product.product?.subscriptionInterval || null,
      subscriptionIntervalCount: product.product?.subscriptionIntervalCount || null,
    }));

    try {
      // TICKET FLOW: For recurring products (subscriptions)
      if (intentionType === 'ticket') {
        console.log('[Invoice] Ticket flow - full fortisResponse:', JSON.stringify(fortisResponse, null, 2));
        
        // Extract ticket_id from Fortis response - data.id is where Fortis puts it
        const ticketId = 
          fortisResponse?.data?.id ||
          fortisResponse?.ticket?.id ||
          fortisResponse?.ticket_id || 
          fortisResponse?.ticketId ||
          fortisResponse?.data?.ticket?.id ||
          fortisResponse?.data?.ticket_id || 
          fortisResponse?.id;
        
        console.log('[Invoice] Ticket flow - extracted ticketId:', ticketId);

        if (!ticketId) {
          console.error('[Invoice] Could not extract ticket_id from response');
          setPaymentError('Card tokenization failed. Please try again.');
          setProcessing(false);
          return;
        }

        const response = await fetch('/api/public/fortis/process-ticket', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'invoice',
            referenceId: invoice.id,
            organizationId: invoice.organizationId,
            ticketId,
            amount: ticketAmount,
            customerEmail: email,
            customerId: invoice.donor?.id,
            products: productsToProcess,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setPaymentSuccess(true);
        } else {
          setPaymentError(data.error || 'Payment failed');
        }
        setProcessing(false);
        return;
      }

      // TRANSACTION FLOW: For one-time payments
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
          savePaymentMethod: shouldSavePaymentMethod,
          products: productsToProcess,
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
      await getPaymentToken(invoice.organizationId, amountDue, invoice.id, invoice);
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
            className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors"
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
          
          {/* Left Column - Invoice Summary (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Merchant Info */}
            <div className="space-y-2">
              {invoice.organization.logo ? (
                <img 
                  src={invoice.organization.logo} 
                  alt={invoice.organization.name} 
                  className="h-12 w-auto max-w-[200px] object-contain" 
                />
              ) : (
                <div 
                  className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                  style={{ backgroundColor: primaryColor }}
                >
                  {invoice.organization.name.charAt(0)}
                </div>
              )}
              <p className="text-gray-600 text-sm">Pay <span className="font-medium text-gray-900">{invoice.organization.name}</span> easily.</p>
              <p className="text-gray-500 text-xs mt-1">Invoice #{invoice.reference || invoice.id}</p>
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

                  {/* Payment Form Container - Fortis Elements has its own Card/ACH tabs */}
                  <div>
                    {demoMode ? (
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
                      <div id="payment-form-container" className="min-h-[150px] -mt-2 [&_iframe]:!mb-0" />
                    )}
                    
                    {paymentError && (
                      <p className="text-red-500 text-sm mt-2">{paymentError}</p>
                    )}
                  </div>

                  {/* Save Payment Method */}
                  <label className={`flex items-center gap-2 ${invoice?.products.some(p => p.product?.isSubscription) ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      checked={savePaymentMethod}
                      onChange={(e) => setSavePaymentMethod(e.target.checked)}
                      disabled={invoice?.products.some(p => p.product?.isSubscription)}
                      className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black disabled:opacity-50"
                    />
                    <span className="text-sm text-gray-600">
                      Save payment method for future use
                      {invoice?.products.some(p => p.product?.isSubscription) && (
                        <span className="text-xs text-muted-foreground ml-2">(Required for subscription)</span>
                      )}
                    </span>
                  </label>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={processing || (!demoMode && (!clientToken || !fortisLoaded))}
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
          className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <span className="text-xs">Powered by</span>
          <Image src="/logo.png" alt="LunarPay" width={50} height={14} className="opacity-60 hover:opacity-100 transition-opacity" />
        </a>
      </footer>
    </div>
  );
}
