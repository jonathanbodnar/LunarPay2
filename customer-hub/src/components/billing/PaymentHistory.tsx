import { formatDate, formatMoney } from '@/lib/utils';
import React, { useEffect, useRef } from 'react';
import LoaderSmall from '../ui/loader-small';
import { useDashboardStore } from '@/store/dashboardStore';
import { Button } from '../ui/button';
import { GoChevronDown } from "react-icons/go";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,  DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { MdFileDownload } from 'react-icons/md';

const PaymentsHistory: React.FC = () => {

  const payments = useDashboardStore((state) => state.payments);
  const paymentsLoading = useDashboardStore((state) => state.paymentsLoading);
  const totalPayments = useDashboardStore((state) => state.totalPayments);
  const fetchPayments = useDashboardStore((state) => state.fetchPayments);
  const setCurrentPage = useDashboardStore((state) => state.setCurrentPage);
  const currentPage = useDashboardStore((state) => state.currentPage);
  
  const hasMore = payments && payments.length < totalPayments;

  const sectionRef = useRef<HTMLDivElement>(null);

  const handleLoadMore = () => {
    setCurrentPage(currentPage + 1);
    fetchPayments(currentPage + 1);
  };

  console.log('PaymentHistory');

  // Use useRef to store the previous value, refs are immutable, so when tab change payments remains the same in ref and the scrollIntoView will remain the same
  const prevPaymentsRef = useRef(payments); 

  useEffect(() => {
    if (prevPaymentsRef.current !== payments) {
      prevPaymentsRef.current = payments;

      if (sectionRef.current) {
        if (currentPage > 1)
          sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        //window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [payments]);


  return (
    <div ref={sectionRef} className="max-w-xl pb-5">
      {/* <h2 className="max-w-xl border-b pb-3 text-xl font-semibold mb-2">Payments History</h2> */}
      {paymentsLoading && currentPage === 1 ? <LoaderSmall  /> : payments === null || payments.length === 0 ? <p>No items found.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] table-fixed md:table-auto">
            <thead>
              <tr className="font-semibold">
                <th className="text-left">ID</th>
                <th className="w-[140px] text-left">Date</th>
                <th className="text-center">Amount</th>
                <th className="text-center">Method</th>
                <th className="text-center">Status</th>
                <th className='text-center' >Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-muted/50">
                  <td className="py-2 overflow-hidden">{payment.id}</td>
                  <td className="py-2 overflow-hidden">{formatDate(payment.created_at)}</td>
                  <td className="py-2 overflow-hidden text-center">{formatMoney(payment.amount)}</td>
                  <td className="py-2 overflow-hidden text-center">{payment.method}</td>
                  <td className="py-2 overflow-hidden text-center">{payment._fts_status_label}</td>
                  
                  <td className="py-2 underline flex items-center justify-center">                    
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
                          <a href={payment._receipt_file_url} className="w-full flex items-center" target="_blank" rel="noopener noreferrer">
                            <MdFileDownload className='mr-2' /> Receipt
                          </a>
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

      {payments && payments.length > 0 && (
        <div className="mt-2 text-center md:pb-0 pb-3">
          <Button className="w-32" variant="ghost" size={"sm"} onClick={handleLoadMore} disabled={paymentsLoading || !hasMore} >
            {paymentsLoading ? <LoaderSmall /> : <>Load more <GoChevronDown /></>}
          </Button>
        </div>
      )}
    </div>
  );
};

export default PaymentsHistory;

