'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Plus, Eye, MoreHorizontal, ArrowUpDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Invoice {
  id: number;
  status: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string | null;
  createdAt: string;
  reference: string | null;
  hash: string;
  donor: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
  organization: {
    name: string;
  };
  products: any[];
}

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/invoices');
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-muted text-muted-foreground uppercase text-[10px] font-semibold tracking-wider',
      finalized: 'bg-foreground text-background uppercase text-[10px] font-semibold tracking-wider',
      sent: 'bg-foreground text-background uppercase text-[10px] font-semibold tracking-wider',
      paid: 'bg-foreground text-background uppercase text-[10px] font-semibold tracking-wider',
      partial: 'bg-warning/10 text-warning uppercase text-[10px] font-semibold tracking-wider',
      overdue: 'bg-destructive/10 text-destructive uppercase text-[10px] font-semibold tracking-wider',
      canceled: 'bg-muted text-muted-foreground uppercase text-[10px] font-semibold tracking-wider',
    };
    return (
      <span className={`px-2.5 py-1 rounded-md ${styles[status] || styles.draft}`}>
        {status === 'overdue' ? 'PAST DUE' : status.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-6 w-6 border-2 border-foreground border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5" />
          <h1 className="text-xl font-semibold">Invoices</h1>
        </div>
        <Button onClick={() => router.push('/invoices/new')}>
          <FileText className="mr-2 h-4 w-4" />
          Create invoice
        </Button>
      </div>

      {invoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No invoices yet</h3>
            <p className="text-muted-foreground text-sm text-center mb-6 max-w-sm">
              Create your first invoice to start tracking payments from your customers
            </p>
            <Button onClick={() => router.push('/invoices/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border">
                <TableHead className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  <button className="flex items-center gap-1 hover:text-foreground">
                    Total <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  <button className="flex items-center gap-1 hover:text-foreground">
                    Status <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  <button className="flex items-center gap-1 hover:text-foreground">
                    Invoice Reference <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  <button className="flex items-center gap-1 hover:text-foreground">
                    Customer <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  <button className="flex items-center gap-1 hover:text-foreground">
                    Due Date <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  <button className="flex items-center gap-1 hover:text-foreground">
                    Created At <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow 
                  key={invoice.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/invoices/${invoice.id}`)}
                >
                  <TableCell className="font-medium">
                    {formatCurrency(Number(invoice.totalAmount))}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(invoice.status)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {invoice.reference || `INV-${invoice.id}`}
                  </TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium">
                        {invoice.donor.firstName} {invoice.donor.lastName}
                      </span>
                      {invoice.donor.email && (
                        <span className="text-muted-foreground"> - {invoice.donor.email}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {invoice.dueDate ? formatDate(invoice.dueDate) : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {invoice.createdAt ? formatDate(invoice.createdAt) : '-'}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Open action menu
                      }}
                      className="p-2 hover:bg-muted rounded-lg"
                    >
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Show</span>
              <select className="border border-border rounded-md px-2 py-1 text-sm bg-background">
                <option>10</option>
                <option>25</option>
                <option>50</option>
              </select>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing 1 to {Math.min(10, invoices.length)} of {invoices.length} entries
            </div>
            <div className="flex items-center gap-1">
              <button className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted disabled:opacity-50">
                &lt;
              </button>
              <button className="px-3 py-1.5 text-sm bg-foreground text-background rounded-md">
                1
              </button>
              {invoices.length > 10 && (
                <button className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted">
                  2
                </button>
              )}
              <button className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted disabled:opacity-50">
                &gt;
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
