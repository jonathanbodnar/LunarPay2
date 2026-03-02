import { formatDate, formatMoney } from '@/lib/utils';
import {  INVOICE_STATUS_LABELS, INVOICE_STATUS_VARIANTS_MAP } from '@/types/invoiceType'; //verifyx rename STATUS_VARIANTS_MAP
import React from 'react';
import { Badge } from '../ui/badge';
import LoaderSmall from '../ui/loader-small';
import { useDashboardStore } from '@/store/dashboardStore';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '../ui/button';
import { MoreHorizontal } from 'lucide-react';
import { MdFileDownload, MdOpenInNew } from 'react-icons/md';

const InvoiceHistory: React.FC = () => {

  const invoices = useDashboardStore((state) => state.invoices);
  const invoicesLoading = useDashboardStore((state) => state.invoicesLoading);
  
  console.log('InvoiceHistory');
 
  return (
    <div>
      {/* <h2 className="max-w-xl border-b pb-3 text-xl font-semibold mb-2">Invoice History</h2> */}
      {invoicesLoading ? <LoaderSmall /> : invoices === null || invoices.length === 0 ? <p>No items found.</p> : (
        <div className="max-w-xl overflow-x-auto pb-4">
          <table className="w-full min-w-[500px] table-fixed md:table-auto">
            <thead>
              <tr className="font-semibold">
              <th className="w-[180px] text-left">Reference</th>
                <th className="w-[110px] text-left">Date</th>
                <th className="text-center w-[110px]">Amount</th>
                <th className="w-[80px] text-center">Status</th>
                <th className="text-center w-[80px]" >Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className={`hover:bg-muted/50`}>
                  <td className="py-2 whitespace-nowrap break-keep">{inv.reference}</td>
                  <td className="py-2">{formatDate(inv.created_at)}</td>
                  <td className="py-2 text-center">{formatMoney(inv.total_amount)}</td>
                  <td className="py-2 text-center">
                    <Badge
                      className="whitespace-nowrap min-w-[70px] font-bold"
                      variant={INVOICE_STATUS_VARIANTS_MAP[inv.status]}
                    >
                      {INVOICE_STATUS_LABELS[inv.status]}
                    </Badge>
                  </td>
                  <td className="py-2 text-center">                    
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel className="font-bold">Actions</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <a href={inv._link} className="w-full flex items-center" target="_blank" rel="noopener noreferrer"><MdOpenInNew className='mr-2' />
                              {inv.status === 'P' ? 'View' : 'Pay'}
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <a href={inv.pdf_url} className="w-full flex items-center" target="_blank" rel="noopener noreferrer"><MdFileDownload className='mr-2' /> Download</a>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InvoiceHistory;
