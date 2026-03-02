// src/pages/SubscriptionCancel.tsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatDate, formatMoney } from '@/lib/utils';
import { toast } from 'sonner';
import { errorHandler } from '@/services/api';
import { cancelSubscription } from '@/services/subscriptionService';
import { AnimatePresence, motion } from "motion/react"
import { motionFadeUp } from '@/lib/utils';
import { Subscription } from '@/types/subscriptionType';
import LoaderSmall from '@/components/ui/loader-small';
import { useDashboardStore } from '@/store/dashboardStore';

const SubscriptionCancel: React.FC = () => {

  const fetchUserProfile = useDashboardStore((state) => state.fetchUserProfile);  
  const { state } = useLocation();
  const { subscription } : {subscription: Subscription}  = state || {};
  const [loading, setLoading] = useState(false);
  const [canceled, setCanceled] = useState(false);
  
  const navigate = useNavigate();
  
  if (!subscription) {
    return <div>No subscription data found.</div>;
  }

  const handleConfirmCancel = async () => {

    setLoading(true);

    try {
      const resp = await cancelSubscription(subscription.id);
      if (resp?.data?.response?.status) {
        setLoading(false);
        setCanceled(true);
        //toast.success(errorHandler(resp), { position: "top-center", })
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
      <h2 className="text-xl font-semibold">Cancel Your Subscription</h2>

      <h2 className="border-b pb-3 font-semibold  mt-10 mb-4">CURRENT SUBSCRIPTION</h2>
      <div className="max-w-[400px]">

        <AnimatePresence>
          {canceled && (
            <motion.p className="my-8 text-center font-semibold" {...motionFadeUp}>
              You have successfully canceled your subscription
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!canceled && (
            <motion.div className="space-y-2" {...motionFadeUp}>
              <p>You're about to cancel <strong className="capitalize">{subscription.product_name}</strong>.</p>
              <p>Next billing date: {formatDate(subscription.next_payment_on)}</p>
              <p className="capitalize">Frequency: {subscription.frequency}</p>
              <p className="font-semibold">Amount: {formatMoney(subscription.amount)}</p>
              <p className="sm mt-5">
                Your subscription will be canceled, but is still available until the end of your billing period on {formatDate(subscription.next_payment_on)}.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex gap-4 mt-6">
          {!canceled && (
            <Button
            className='w-32'
              onClick={handleConfirmCancel}
              disabled={loading || canceled}
            >
              {loading ? <LoaderSmall /> : 'Yes, Cancel'}
            </Button>
          )}
          <Button variant="ghost" onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCancel;
