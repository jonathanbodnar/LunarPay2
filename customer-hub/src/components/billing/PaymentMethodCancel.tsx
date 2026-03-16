import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { errorHandler } from '@/services/api';
import { AnimatePresence, motion } from "motion/react"
import { motionFadeUp } from '@/lib/utils';
import { PaymentMethod } from '@/types/paymentMethodType';
import { removePaymentMethod } from '@/services/paymentService';
import LoaderSmall from '@/components/ui/loader-small';
import { useDashboardStore } from '@/store/dashboardStore';

const PaymentMethodCancel: React.FC = () => {

  const fetchUserProfile = useDashboardStore((state) => state.fetchUserProfile);

  const { state } = useLocation();
  const navigate = useNavigate();

  const { paymentMethod }: { paymentMethod: PaymentMethod } = state || {};
  const [loading, setLoading] = useState(false);
  const [canceled, setCanceled] = useState(false);

  if (!paymentMethod) {
    return <div>No payment method data found.</div>;
  }

  const handleConfirmCancel = async () => {

    setLoading(true);

    try {
      const resp = await removePaymentMethod(paymentMethod.id);
      if (resp?.data?.response?.status) {
        setLoading(false);
        setCanceled(true);
        setTimeout(() => {
          fetchUserProfile();
          //navigate(-1);
        }, 1000);

      } else {
        toast.error(errorHandler(resp), { position: "top-center", })
      }
    } catch (err: any) {
      toast.error(errorHandler(err), { position: "top-center", })
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="text-xl font-semibold">Remove your payment method</h2>

      <h2 className="border-b pb-3 font-semibold  mt-10 mb-4">CURRENT PAYMENT METHOD</h2>
      <div className="max-w-[400px]">

        <AnimatePresence>
          {canceled && (
            <motion.p className="my-8 text-center font-semibold" {...motionFadeUp}>
              You have successfully removed your payment method
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!canceled && (
            <motion.div className="space-y-2" {...motionFadeUp}>
              <p>You're about to remove <strong className="capitalize">{paymentMethod.src_account_type} •••• {paymentMethod.last_digits}</strong>.</p>
              <p>
                Once removed, it will no longer be available for future payments.

              </p>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex gap-4 mt-6">
          {!canceled && (
            <Button
            className='w-58'
              onClick={handleConfirmCancel}
              disabled={loading || canceled}
            >
              {loading ? <LoaderSmall /> : 'Yes, Remove payment method'}
            </Button>
          )}
          <Button variant="ghost" onClick={() => navigate(-1)}>Go Back</Button>
        </div>        
      </div>
    </div>
  );
};

export default PaymentMethodCancel;
