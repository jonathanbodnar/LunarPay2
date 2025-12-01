'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Download, ExternalLink } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchInvoice();
    }
  }, [params.id]);

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setInvoice(data.invoice);
      }
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>;
  }

  if (!invoice) {
    return <div>Invoice not found</div>;
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      finalized: 'bg-blue-100 text-blue-800',
      sent: 'bg-purple-100 text-purple-800',
      paid: 'bg-green-100 text-green-800',
      partial: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${styles[status] || styles.draft}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const isPaid = invoice.status === 'paid';
  const amountDue = Number(invoice.totalAmount) - Number(invoice.paidAmount);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Invoice {invoice.reference && `#${invoice.reference}`}
            </h1>
            {getStatusBadge(invoice.status)}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open(`/invoice/${invoice.hash}`, '_blank')}>
            <ExternalLink className="mr-2 h-4 w-4" />
            View Customer Portal
          </Button>
          <Button variant="outline">
            <Mail className="mr-2 h-4 w-4" />
            Send
          </Button>
          {invoice.pdfUrl && (
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Customer Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-2">BILL TO</h3>
              <p className="font-medium">
                {invoice.donor.firstName} {invoice.donor.lastName}
              </p>
              {invoice.donor.email && <p className="text-gray-600">{invoice.donor.email}</p>}
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
                    {invoice.products.map((product: any, index: number) => (
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
                  </tfoot>
                </table>
              </div>
            </div>

            {invoice.memo && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-2">NOTES</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{invoice.memo}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Organization</p>
              <p className="font-medium">{invoice.organization.name}</p>
            </div>

            {invoice.dueDate && (
              <div>
                <p className="text-sm text-gray-500">Due Date</p>
                <p className="font-medium">{formatDate(invoice.dueDate)}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(Number(invoice.totalAmount))}
              </p>
            </div>

            {Number(invoice.paidAmount) > 0 && (
              <>
                <div>
                  <p className="text-sm text-gray-500">Paid</p>
                  <p className="text-lg font-medium text-green-600">
                    {formatCurrency(Number(invoice.paidAmount))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Amount Due</p>
                  <p className="text-xl font-bold text-orange-600">
                    {formatCurrency(amountDue)}
                  </p>
                </div>
              </>
            )}

            <div>
              <p className="text-sm text-gray-500">Payment Options</p>
              <p className="font-medium">
                {invoice.paymentOptions === 'both' && 'Credit Card & ACH'}
                {invoice.paymentOptions === 'cc' && 'Credit Card Only'}
                {invoice.paymentOptions === 'ach' && 'ACH Only'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

