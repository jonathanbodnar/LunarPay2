'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Download, CreditCard, Building2, ChevronRight, ChevronDown } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Invoice {
  id: number;
  status: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string | null;
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
  const [showDetails, setShowDetails] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'amex' | 'bank'>('card');
  const [processing, setProcessing] = useState(false);

  // Branding colors with defaults
  const primaryColor = invoice?.organization?.primaryColor || '#000000';
  const backgroundColor = invoice?.organization?.backgroundColor || '#ffffff';
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
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
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
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor }}>
        <div className="text-center">
          <div 
            className="animate-spin h-6 w-6 border-2 border-t-transparent rounded-full mx-auto mb-4"
            style={{ borderColor: primaryColor }}
          />
          <p className="text-sm" style={{ color: `${primaryColor}80` }}>Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4" style={{ backgroundColor }}>
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4" style={{ color: `${primaryColor}60` }} />
            <h2 className="text-xl font-semibold mb-2">Invoice Not Found</h2>
            <p className="text-muted-foreground">{error || 'This invoice does not exist or has been removed.'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPaid = invoice.status === 'paid';
  const amountDue = Number(invoice.totalAmount) - Number(invoice.paidAmount);

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor }}>
      <div className="max-w-lg mx-auto space-y-6">
        {/* Invoice Header Card */}
        <Card>
          <CardContent className="pt-6">
            {/* Organization Logo/Name */}
            <div className="flex items-start justify-between mb-4">
              <div>
                {invoice.organization.logo ? (
                  <img 
                    src={invoice.organization.logo} 
                    alt={invoice.organization.name} 
                    className="h-10 mb-3 object-contain" 
                  />
                ) : (
                  <h2 
                    className="text-xl font-bold tracking-tight mb-1"
                    style={{ color: primaryColor }}
                  >
                    {invoice.organization.name.toUpperCase()}
                  </h2>
                )}
                {/* Amount */}
                <p className="text-3xl font-bold mt-2" style={{ color: primaryColor }}>
                  {formatCurrency(amountDue)}
                </p>
                {invoice.dueDate && (
                  <p className="text-muted-foreground text-sm">Due {formatDate(invoice.dueDate)}</p>
                )}
              </div>
              <button 
                onClick={handleDownloadPDF} 
                className="p-2 rounded-lg transition-colors"
                style={{ color: primaryColor }}
              >
                <FileText className="h-6 w-6" />
              </button>
            </div>

            {/* Invoice Details */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Business name</span>
                <span className="font-medium">{invoice.organization.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer name</span>
                <span className="font-medium">{invoice.donor.firstName} {invoice.donor.lastName}</span>
              </div>
              {invoice.memo && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Memo</span>
                  <span className="font-medium text-right max-w-[200px]">{invoice.memo}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-border space-y-2">
              <button 
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 text-sm font-medium"
                style={{ color: primaryColor }}
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
              
              <button 
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                {showDetails ? 'Hide' : 'Show'} Invoice Details
                {showDetails ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            </div>

            {/* Expandable Invoice Details */}
            {showDetails && (
              <div className="mt-4 pt-4 border-t border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground">
                      <th className="text-left py-2">Item</th>
                      <th className="text-right py-2">Qty</th>
                      <th className="text-right py-2">Price</th>
                      <th className="text-right py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.products.map((product, idx) => (
                      <tr key={idx}>
                        <td className="py-2">{product.productName}</td>
                        <td className="py-2 text-right">{product.qty}</td>
                        <td className="py-2 text-right">{formatCurrency(Number(product.price))}</td>
                        <td className="py-2 text-right font-medium">{formatCurrency(Number(product.subtotal))}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border">
                      <td colSpan={3} className="py-2 text-right font-medium">Total</td>
                      <td className="py-2 text-right font-bold" style={{ color: primaryColor }}>
                        {formatCurrency(Number(invoice.totalAmount))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Section */}
        {!isPaid && amountDue > 0 && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Payment method</h3>
              
              {/* Payment Method Selection */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => setPaymentMethod('card')}
                  className="flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors"
                  style={{
                    borderColor: paymentMethod === 'card' ? primaryColor : undefined,
                    backgroundColor: paymentMethod === 'card' ? `${primaryColor}10` : undefined,
                  }}
                >
                  <CreditCard className="h-6 w-6" />
                  <span className="text-xs">Card</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('amex')}
                  className="flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors"
                  style={{
                    borderColor: paymentMethod === 'amex' ? primaryColor : undefined,
                    backgroundColor: paymentMethod === 'amex' ? `${primaryColor}10` : undefined,
                  }}
                >
                  <span className="text-xs font-bold">AMEX</span>
                  <span className="text-xs">American Express</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('bank')}
                  className="flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors"
                  style={{
                    borderColor: paymentMethod === 'bank' ? primaryColor : undefined,
                    backgroundColor: paymentMethod === 'bank' ? `${primaryColor}10` : undefined,
                  }}
                >
                  <Building2 className="h-6 w-6" />
                  <span className="text-xs">Bank</span>
                </button>
              </div>

              {/* Payment Form */}
              <form onSubmit={handlePayment}>
                <h4 className="font-semibold mb-4">Payment Info</h4>
                
                {paymentMethod !== 'bank' ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Card Number"
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="MM/YY"
                        className="px-4 py-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2"
                        style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                      />
                      <input
                        type="text"
                        placeholder="CVV"
                        className="px-4 py-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2"
                        style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Billing ZIP Code"
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Routing Number"
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                    />
                    <input
                      type="text"
                      placeholder="Account Number"
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                    />
                    <select 
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                    >
                      <option>Checking</option>
                      <option>Savings</option>
                    </select>
                  </div>
                )}

                <button 
                  type="submit" 
                  className="w-full mt-6 py-3 rounded-lg font-medium text-base transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: primaryColor, color: buttonTextColor }}
                  disabled={processing}
                >
                  {processing ? 'Processing...' : `Pay ${formatCurrency(amountDue)}`}
                </button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Paid Status */}
        {isPaid && (
          <Card style={{ backgroundColor: `${primaryColor}10`, borderColor: `${primaryColor}30` }}>
            <CardContent className="pt-6 text-center">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <svg className="w-8 h-8" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Invoice Paid</h3>
              <p className="text-muted-foreground">This invoice has been paid in full. Thank you!</p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          Powered by LunarPay
        </p>
      </div>
    </div>
  );
}
