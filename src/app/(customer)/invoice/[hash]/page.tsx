'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, CreditCard } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Invoice {
  id: number;
  status: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string | null;
  reference: string | null;
  memo: string | null;
  organization: {
    name: string;
    logo: string | null;
    email: string | null;
    phoneNumber: string | null;
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

export default function InvoicePage() {
  const params = useParams();
  const hash = params?.hash as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);

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

  const handlePayment = () => {
    setPaying(true);
    // TODO: Open Fortis Elements payment modal
    alert('Payment modal will open here with Fortis Elements integration');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invoice Not Found</h2>
            <p className="text-gray-500">{error || 'This invoice does not exist or has been removed.'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPaid = invoice.status === 'paid';
  const amountDue = Number(invoice.totalAmount) - Number(invoice.paidAmount);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {invoice.organization.logo && (
            <img src={invoice.organization.logo} alt={invoice.organization.name} className="h-16 mx-auto mb-4" />
          )}
          <h1 className="text-3xl font-bold text-gray-900">{invoice.organization.name}</h1>
          {invoice.organization.email && (
            <p className="text-gray-600 mt-1">{invoice.organization.email}</p>
          )}
        </div>

        {/* Invoice Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">Invoice</CardTitle>
                {invoice.reference && (
                  <CardDescription className="text-lg mt-1">#{invoice.reference}</CardDescription>
                )}
              </div>
              <div className="text-right">
                {isPaid ? (
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                    Paid
                  </span>
                ) : (
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-800">
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Bill To */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-2">BILL TO</h3>
              <p className="font-medium">
                {invoice.donor.firstName} {invoice.donor.lastName}
              </p>
              {invoice.donor.email && (
                <p className="text-gray-600">{invoice.donor.email}</p>
              )}
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {invoice.dueDate && (
                <div>
                  <p className="text-gray-500">Due Date</p>
                  <p className="font-medium">{formatDate(invoice.dueDate)}</p>
                </div>
              )}
              <div>
                <p className="text-gray-500">Amount Due</p>
                <p className="font-medium text-lg">{formatCurrency(amountDue)}</p>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-3">ITEMS</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invoice.products.map((product, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3">{product.productName}</td>
                        <td className="px-4 py-3 text-right">{product.qty}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(Number(product.price))}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(Number(product.subtotal))}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right font-semibold">Total</td>
                      <td className="px-4 py-3 text-right font-bold text-lg">{formatCurrency(Number(invoice.totalAmount))}</td>
                    </tr>
                    {Number(invoice.paidAmount) > 0 && (
                      <>
                        <tr>
                          <td colSpan={3} className="px-4 py-2 text-right text-gray-600">Paid</td>
                          <td className="px-4 py-2 text-right text-gray-600">-{formatCurrency(Number(invoice.paidAmount))}</td>
                        </tr>
                        <tr>
                          <td colSpan={3} className="px-4 py-3 text-right font-semibold">Amount Due</td>
                          <td className="px-4 py-3 text-right font-bold text-lg text-blue-600">{formatCurrency(amountDue)}</td>
                        </tr>
                      </>
                    )}
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Memo */}
            {invoice.memo && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-2">NOTES</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{invoice.memo}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        {!isPaid && amountDue > 0 && (
          <div className="flex gap-4">
            <Button size="lg" className="flex-1" onClick={handlePayment} disabled={paying}>
              <CreditCard className="mr-2 h-5 w-5" />
              {paying ? 'Processing...' : `Pay ${formatCurrency(amountDue)}`}
            </Button>
            {invoice.pdfUrl && (
              <Button size="lg" variant="outline">
                <Download className="mr-2 h-5 w-5" />
                Download PDF
              </Button>
            )}
          </div>
        )}

        {isPaid && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6 text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">Invoice Paid</h3>
              <p className="text-green-700">This invoice has been paid in full. Thank you!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

