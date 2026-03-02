import { formatDate, formatMoney } from '@/lib/utils';
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_VARIANTS_MAP } from '@/types/invoiceType';
import React from 'react';
import { Badge } from '../ui/badge';
import LoaderSmall from '../ui/loader-small';
import { useDashboardStore } from '@/store/dashboardStore';
import { PaymentProduct, PaymentWithProducts } from '@/types/PaymentProductType';
import { DownloadCloud, DownloadIcon } from 'lucide-react';

const Products: React.FC = () => {

  const paymentsProducts = useDashboardStore((state) => state.paymentsProducts);
  const isLoading = useDashboardStore((state) => state.productsLoading);

  console.log('Products');

  return (
    <div>
      {/* <h2 className="max-w-xl border-b pb-3 text-xl font-semibold mb-2">Invoice History</h2> */}
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3 px-2">

        {isLoading ? <LoaderSmall /> : paymentsProducts === null || paymentsProducts.length === 0 ? <p>No items found.</p> : (
          <>
            {paymentsProducts.map((payment: PaymentWithProducts) => (
              [...(payment.invoice_products || []), ...(payment.payment_link_products || [])].map((item: PaymentProduct) => (
                <li
                  key={item.id}
                  className="w-full max-w-full md:max-w-[450px] border rounded-sm p-4 shadow-sm hover:shadow-md"
                  >
                  <div className="flex flex-col space-y-2">
                    <p className="text-base font-medium">{item.product_name}</p>

                    <p className="text-xl font-bold">
                      {formatMoney(item.price)} {item.quantity > 1 && <span className="text-sm font-normal text-muted-foreground">x {item.quantity}</span>}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      Purchased on: {payment.created_at && formatDate(payment.created_at)}
                    </p>

                    {item.digital_content_url && (
                      <div className="text-sm underline flex items-center gap-1 text-muted-foreground">
                        <a href={item.digital_content_url} target="_blank" rel="noopener noreferrer">
                          Deliverable
                        </a>
                        <DownloadCloud className="size-4" />
                      </div>
                    )}
                  </div>
                </li>
              ))
            ))}
          </>
        )}

      </ul>
    </div>
  );
};



export default Products;
