'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Lock, CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react';
import '@/types/global';

interface SessionData {
  id: number;
  amount: number;
  currency: string;
  description: string | null;
  customer_email: string | null;
  customer_name: string | null;
  status: string;
  cancel_url: string | null;
  success_url: string | null;
  expires_at: string;
  organization_id: number;
  org_name: string;
  org_logo: string | null;
  primary_color: string;
  background_color: string;
  button_text_color: string;
}

export default function HostedCheckoutPage() {
  const params = useParams();
  const token = params?.token as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fortis state
  const [clientToken, setClientToken] = useState<string | null>(null);
  const [fortisLoaded, setFortisLoaded] = useState(false);
  const [fortisEnvironment, setFortisEnvironment] = useState<'sandbox' | 'production'>('production');
  const [payForm, setPayForm] = useState<any>(null);

  // Payment state
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/checkout/session?token=${token}`);
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 410) {
          setError('This payment link has expired.');
        } else {
          setError(data.error || 'Payment session not found.');
        }
        return;
      }

      setSession(data.session);

      if (data.session.status === 'completed') return;

      await getPaymentToken(data.session.organization_id, data.session.amount);
    } catch (err) {
      setError('Failed to load payment session.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const getPaymentToken = async (orgId: number, amount: number) => {
    try {
      const res = await fetch('/api/public/fortis/transaction-intention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: orgId,
          amount,
          action: 'sale',
          type: 'checkout',
          hasRecurring: true, // Always use ticket intention to save card for installments
        }),
      });

      const data = await res.json();
      if (data.success && data.clientToken) {
        setClientToken(data.clientToken);
        setFortisEnvironment(data.environment === 'production' ? 'production' : 'sandbox');
      } else {
        setPaymentError('Unable to initialize payment. Please try again.');
      }
    } catch (err) {
      setPaymentError('Unable to connect to payment processor.');
    }
  };

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Load Fortis Elements script
  useEffect(() => {
    if (!clientToken || !session) return;
    if (window.Commerce?.elements) {
      setFortisLoaded(true);
      return;
    }

    const scriptUrl = fortisEnvironment === 'production'
      ? 'https://js.fortis.tech/commercejs-v1.0.0.min.js'
      : 'https://js.sandbox.fortis.tech/commercejs-v1.0.0.min.js';

    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;
    script.onload = () => setFortisLoaded(true);
    script.onerror = () => setPaymentError('Failed to load payment form. Please refresh.');
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, [clientToken, session, fortisEnvironment]);

  // Initialize Fortis payment form
  useEffect(() => {
    if (!clientToken || !fortisLoaded || !window.Commerce?.elements || !session) return;

    const primaryColor = session.primary_color || '#000000';
    const buttonTextColor = session.button_text_color || '#ffffff';

    try {
      const elements: any = new (window as any).Commerce.elements(clientToken);

      const handleSuccess = async (payload: any) => {
        await processPayment(payload);
      };

      if (elements.eventBus) {
        elements.eventBus.on('ready', () => {});
        elements.eventBus.on('payment_success', handleSuccess);
        elements.eventBus.on('success', handleSuccess);
        elements.eventBus.on('done', handleSuccess);
        elements.eventBus.on('payment_error', (err: any) => {
          setPaymentError(err?.message || 'Payment failed. Please try again.');
          setProcessing(false);
        });
        elements.eventBus.on('error', (err: any) => {
          setPaymentError(err?.message || 'Payment error.');
        });
      } else {
        elements.on('ready', () => {});
        elements.on('done', handleSuccess);
        elements.on('error', (err: any) => setPaymentError(err?.message || 'Payment error.'));
      }

      elements.create({
        container: '#checkout-payment-form',
        theme: 'default',
        environment: fortisEnvironment,
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
          colorButtonSelectedBackground: primaryColor,
          colorButtonSelectedText: buttonTextColor,
          colorButtonText: '#4a5568',
          colorButtonBackground: '#f7fafc',
          colorBackground: '#ffffff',
          colorText: '#1a202c',
          fontFamily: 'Roboto',
          fontSize: '16px',
          borderRadius: '8px',
        },
      });

      setPayForm(elements);
    } catch (err) {
      console.error('[Checkout] Fortis init error:', err);
      setPaymentError('Failed to initialize payment form.');
    }
  }, [clientToken, fortisLoaded, session, fortisEnvironment]);

  const processPayment = async (fortisResponse: any) => {
    setProcessing(true);
    setPaymentError('');

    try {
      // Extract ticket_id from Fortis ticket response
      const ticketId =
        fortisResponse?.data?.id ||
        fortisResponse?.ticket?.id ||
        fortisResponse?.ticket_id ||
        fortisResponse?.ticketId ||
        fortisResponse?.data?.ticket?.id ||
        fortisResponse?.data?.ticket_id ||
        fortisResponse?.id;

      if (!ticketId) {
        console.error('[Checkout] Could not extract ticket_id from response:', fortisResponse);
        setPaymentError('Card tokenization failed. Please try again.');
        setProcessing(false);
        return;
      }

      // Process the ticket sale (charges the card and saves the token)
      const amountInCents = Math.round((session?.amount || 0) * 100);

      const nameParts = (session?.customer_name || '').split(' ');
      const res = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          ticketId,
          amount: amountInCents,
          customerEmail: session?.customer_email,
          customerFirstName: nameParts[0] || '',
          customerLastName: nameParts.slice(1).join(' ') || '',
        }),
      });

      const data = await res.json();

      if (data.success) {
        setPaymentSuccess(true);
        if (data.success_url) {
          const separator = data.success_url.includes('?') ? '&' : '?';
          const redirectUrl = `${data.success_url}${separator}session_id=${session?.id}`;
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 2000);
        }
      } else {
        setPaymentError(data.error || 'Payment failed.');
      }
    } catch (err) {
      setPaymentError('Failed to process payment.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePay = () => {
    if (!payForm) {
      setPaymentError('Payment form not ready.');
      return;
    }
    setProcessing(true);
    setPaymentError('');
    try {
      payForm.submit();
    } catch (err) {
      setPaymentError('Failed to submit payment.');
      setProcessing(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  // --- Loading State ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-gray-900 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading payment...</p>
        </div>
      </div>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <XCircle className="h-14 w-14 mx-auto mb-4 text-red-400" />
          <h2 className="text-xl font-semibold mb-2 text-gray-900">{error}</h2>
          {session?.cancel_url && (
            <a
              href={session.cancel_url}
              className="inline-flex items-center gap-2 mt-4 text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-4 w-4" /> Go back
            </a>
          )}
        </div>
      </div>
    );
  }

  if (!session) return null;

  // --- Already Paid ---
  if (session.status === 'completed' || paymentSuccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="h-14 w-14 mx-auto mb-4 text-green-500" />
          <h2 className="text-xl font-semibold mb-2 text-gray-900">Payment Successful</h2>
          <p className="text-gray-500 mb-1">
            {formatAmount(session.amount, session.currency)} paid to {session.org_name}
          </p>
          {session.description && (
            <p className="text-sm text-gray-400 mb-4">{session.description}</p>
          )}
          {session.success_url && (
            <a
              href={session.success_url}
              className="inline-block mt-4 px-6 py-2.5 rounded-lg text-white text-sm font-medium transition-colors"
              style={{ backgroundColor: session.primary_color }}
            >
              Continue
            </a>
          )}
        </div>
      </div>
    );
  }

  // --- Main Payment Form ---
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ backgroundColor: session.background_color || '#f8fafc' }}
    >
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              {session.org_logo ? (
                <img
                  src={session.org_logo}
                  alt={session.org_name}
                  className="h-10 w-10 rounded-lg object-contain"
                />
              ) : (
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: session.primary_color }}
                >
                  {session.org_name.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{session.org_name}</h1>
              </div>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold text-gray-900">
                {formatAmount(session.amount, session.currency)}
              </span>
              {session.currency !== 'USD' && (
                <span className="text-xs text-gray-400 uppercase">{session.currency}</span>
              )}
            </div>

            {session.description && (
              <p className="mt-2 text-sm text-gray-500">{session.description}</p>
            )}
          </div>

          {/* Payment Form */}
          <div className="px-6 py-5">
            <div
              id="checkout-payment-form"
              className="min-h-[200px]"
            >
              {!clientToken && !paymentError && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-6 w-6 border-3 border-gray-900 border-t-transparent rounded-full" />
                  <span className="ml-3 text-gray-500 text-sm">Loading payment form...</span>
                </div>
              )}
            </div>

            {paymentError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {paymentError}
              </div>
            )}
          </div>

          {/* Pay Button */}
          <div className="px-6 pb-6">
            <button
              onClick={handlePay}
              disabled={!payForm || processing}
              className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: session.primary_color,
                color: session.button_text_color,
              }}
            >
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Processing...
                </span>
              ) : (
                `Pay ${formatAmount(session.amount, session.currency)}`
              )}
            </button>

            {session.cancel_url && (
              <a
                href={session.cancel_url}
                className="block mt-3 text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Cancel
              </a>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
              <Lock className="h-3 w-3" />
              <span>Secured by LunarPay</span>
            </div>
          </div>
        </div>

        {/* Expiry Notice */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <Clock className="h-3 w-3" />
          <span>
            Expires {new Date(session.expires_at).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
