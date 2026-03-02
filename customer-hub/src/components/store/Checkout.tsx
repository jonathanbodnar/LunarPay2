import React, { useState } from 'react';
import { useShopStore } from '@/store/shopStore';
import { formatMoney } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Product } from '@/types/ProductType';
import { ProductItem } from './ProductItem';
import { LoginDialog } from '../auth/LoginDialog';
import { GetAuthContext } from '@/contexts/auth/GetAuthContext';
import { buildPaymentLinkDataFromCart } from '@/services/paymentLinkService';
import { createPaymentLink } from '@/services/paymentLinkService';
import { toast } from 'sonner';
import { errorHandler } from '@/services/api';
import LoaderSmall from '../ui/loader-small';

type CheckoutProps = {
  tenantSlug: string
}
const Checkout: React.FC<CheckoutProps> = ({ tenantSlug }) => {

  const { handleCheckAuth, tenantData } = GetAuthContext();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const cart = useShopStore((s) => s.cart);
  const total = useShopStore((s) => s.total);

  const [loading, setLoading] = useState(false);

  if (!cart || cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <h2 className="text-xl font-semibold">Your cart is empty.</h2>
      </div>
    );
  }

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const resp = await handleCheckAuth();
      
      if(resp?.data?.response?.status) {
        try {

          const productsCart = useShopStore.getState().cart;
          if (!productsCart || productsCart.length === 0) {
            throw new Error('Cart is empty');
          }
          const data = buildPaymentLinkDataFromCart(tenantData.church_id, productsCart);
          
          const resp = await createPaymentLink(data);

          if(resp?.data?.response?.status) {
            toast.success('Redirecting ...', { position: "top-center"})
            setTimeout(() => {
              setLoading(false);
              window.location.href = resp.data.response.link;
            }, 2000);
            return;
          }
          
        } catch (error) {
          toast.error(errorHandler(error), { position: "top-center", })
        }
      } else {
        setShowLoginDialog(true);  
      }
    } catch (err) {
      setShowLoginDialog(true);  
    }
    setLoading(false);
  };

  return (
    <>
      <h2 className="text-3xl font-bold mb-6">Review your plan</h2>
      <div className="grid grid-cols-1 md:grid-cols-6 gap-8 items-start pb-6">
        {/* Left column: takes 2/3 width */}
        <ul className="md:col-span-4 space-y-4">
          {cart.map((item: Product) => (
            <ProductItem
              key={item.id}
              item={item}
            />
          ))}
        </ul>

        {/* Right column: takes 1/3 width */}
        <div className="md:col-span-2 sticky top-4 self-start w-full text-center">
          <div className="mb-4 md:mt-0 mt-0 text-center text-md font-semibold border rounded-sm p-5 shadow-sm hover:shadow-md">
            Total: {formatMoney(total)}
          </div>
          <Button variant="default" className="w-full font-extrabold" onClick={handleConfirm} disabled={loading}>
            {loading ? <LoaderSmall /> : 'Proceed to payment'} 
          </Button>
        </div>

        <LoginDialog showDialog={showLoginDialog} setShowLoginDialog={setShowLoginDialog} tenantSlug={tenantSlug} />
      </div>

    </>

  );
};

export default Checkout;


