'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  ExternalLink, 
  FileDown, 
  Link2, 
  Mail, 
  Copy, 
  Ban,
  ChevronDown,
  Check
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchInvoice();
    }
  }, [params.id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActionsOpen(false);
    if (actionsOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [actionsOpen]);

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

  const handleViewAsCustomer = () => {
    window.open(`/invoice/${invoice.hash}`, '_blank');
    setActionsOpen(false);
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoice.reference || invoice.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } catch (error) {
      console.error('Failed to download PDF:', error);
    }
    setActionsOpen(false);
  };

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/invoice/${invoice.hash}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setActionsOpen(false);
  };

  const handleSendInvoice = async () => {
    setSending(true);
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/send-email`, {
        method: 'POST',
      });
      if (response.ok) {
        await fetchInvoice(); // Refresh invoice to update status
        alert('Invoice sent successfully!');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to send invoice');
      }
    } catch (error) {
      console.error('Failed to send invoice:', error);
      alert('Failed to send invoice');
    } finally {
      setSending(false);
      setActionsOpen(false);
    }
  };

  const handleClone = async () => {
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/clone`, {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        router.push(`/invoices/${data.invoice.id}/edit`);
      }
    } catch (error) {
      console.error('Failed to clone invoice:', error);
    }
    setActionsOpen(false);
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this invoice?')) return;
    
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/cancel`, {
        method: 'POST',
      });
      if (response.ok) {
        await fetchInvoice();
      }
    } catch (error) {
      console.error('Failed to cancel invoice:', error);
    }
    setActionsOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-6 w-6 border-2 border-foreground border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!invoice) {
    return <div className="text-center py-12 text-muted-foreground">Invoice not found</div>;
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-muted text-muted-foreground',
      finalized: 'bg-foreground text-background',
      sent: 'bg-foreground text-background',
      paid: 'bg-success text-success-foreground',
      partial: 'bg-warning/20 text-warning',
      overdue: 'bg-destructive/20 text-destructive',
      canceled: 'bg-muted text-muted-foreground line-through',
    };
    return (
      <span className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-md ${styles[status] || styles.draft}`}>
        {status}
      </span>
    );
  };

  const amountDue = Number(invoice.totalAmount) - Number(invoice.paidAmount);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold">
                Invoice {invoice.reference ? `#${invoice.reference}` : `#${invoice.id}`}
              </h1>
              {getStatusBadge(invoice.status)}
            </div>
          </div>
        </div>
        
        {/* Actions Dropdown */}
        <div className="relative">
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              setActionsOpen(!actionsOpen);
            }}
            className="gap-2"
          >
            Actions
            <ChevronDown className={`h-4 w-4 transition-transform ${actionsOpen ? 'rotate-180' : ''}`} />
          </Button>
          
          {actionsOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-background rounded-xl border border-border shadow-lg z-50 py-2">
              <button
                onClick={handleViewAsCustomer}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                View as customer
              </button>
              <button
                onClick={handleDownloadPDF}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
              >
                <FileDown className="h-4 w-4" />
                Download PDF
              </button>
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
              >
                {copied ? <Check className="h-4 w-4 text-success" /> : <Link2 className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={handleSendInvoice}
                disabled={sending}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors disabled:opacity-50"
              >
                <Mail className="h-4 w-4" />
                {sending ? 'Sending...' : 'Send Invoice'}
              </button>
              <button
                onClick={handleClone}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
              >
                <Copy className="h-4 w-4" />
                Clone
              </button>
              {invoice.status !== 'canceled' && invoice.status !== 'paid' && (
                <button
                  onClick={handleCancel}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Ban className="h-4 w-4" />
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-medium">Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Organization */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">FROM</p>
              <p className="font-medium">{invoice.organization.name}</p>
            </div>

            {/* Customer Info */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">CUSTOMER</p>
              <p className="font-medium">
                {invoice.donor.firstName} {invoice.donor.lastName}
              </p>
              {invoice.donor.email && <p className="text-muted-foreground text-sm">{invoice.donor.email}</p>}
            </div>

            {/* Line Items */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">ITEMS</p>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Description</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Qty</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Price</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {invoice.products.map((product: any, index: number) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm">{product.productName}</td>
                        <td className="px-4 py-3 text-sm text-right">{product.qty}</td>
                        <td className="px-4 py-3 text-sm text-right">{formatCurrency(Number(product.price))}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(Number(product.subtotal))}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right font-medium">Total</td>
                      <td className="px-4 py-3 text-right font-bold text-lg">{formatCurrency(Number(invoice.totalAmount))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {invoice.memo && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">NOTES</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.memo}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {invoice.dueDate && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">DUE DATE</p>
                  <p className="font-medium">{formatDate(invoice.dueDate)}</p>
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">TOTAL AMOUNT</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(Number(invoice.totalAmount))}
                </p>
              </div>

              {Number(invoice.paidAmount) > 0 && (
                <>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">PAID</p>
                    <p className="text-lg font-medium text-success">
                      {formatCurrency(Number(invoice.paidAmount))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">BALANCE DUE</p>
                    <p className="text-xl font-bold text-warning">
                      {formatCurrency(amountDue)}
                    </p>
                  </div>
                </>
              )}

              {invoice.fee && Number(invoice.fee) > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">FEE COVERED</p>
                  <p className="font-medium">{formatCurrency(Number(invoice.fee))}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Public Link */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Public Link</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/invoice/${invoice.hash}`}
                  className="flex-1 text-xs bg-muted px-3 py-2 rounded-lg border-0"
                />
                <Button size="sm" variant="outline" onClick={handleCopyLink}>
                  {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
