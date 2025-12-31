'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { FileText, Download, CreditCard, Landmark, Lock } from 'lucide-react';
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
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
  products: Array<{
    productName: string;
    qty: number;
    price: number;
    subtotal: number;
  }>;
}

export default function PublicInvoicePage() {
  const params = useParams();
  const hash = params?.hash as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'amex' | 'bank'>('card');
  const [processing, setProcessing] = useState(false);
  
  // Form state
  const [email, setEmail] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cardName, setCardName] = useState('');

  // Branding colors with defaults
  const primaryColor = invoice?.organization?.primaryColor || '#000000';
  const backgroundColor = invoice?.organization?.backgroundColor || '#f8fafc';
  const buttonTextColor = invoice?.organization?.buttonTextColor || '#ffffff';

  useEffect(() => {
    fetchInvoice();
  }, [hash]);

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
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
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

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    // TODO: Integrate with Fortis payment processing
    alert('Payment processing will be integrated with Fortis Elements');
    setProcessing(false);
  };

  const handleDownloadPDF = async () => {
    try {
      window.open(`/api/invoices/public/${hash}/pdf`, '_blank');
    } catch (error) {
      console.error('Failed to download PDF:', error);
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
              </p>
              <p className="text-gray-500 mt-1">
                {invoice.dueDate ? `Due ${formatDate(invoice.dueDate)}` : 'Due today'}
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
                  </div>
                  <p className="font-medium text-gray-900">
                    {formatCurrency(Number(product.subtotal))}
                  </p>
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
                  disabled={processing}
                  className="w-full py-4 rounded-lg font-medium text-lg transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: primaryColor, color: buttonTextColor }}
                >
                  {processing ? 'Processing...' : `Pay ${formatCurrency(amountDue)}`}
                </button>

                {/* Terms */}
                <p className="text-xs text-gray-500 text-center leading-relaxed">
                  By clicking on "Pay", you agree to allow {invoice.organization.name} to charge your card for this payment.
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
