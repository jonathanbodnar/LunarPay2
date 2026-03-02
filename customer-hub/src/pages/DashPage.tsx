import React, { use, useEffect } from 'react';
import PaymentMethods from '@/components/billing/PaymentMethods';
import { AnimatePresence, motion } from 'motion/react';
import { motionFadeUp } from '@/lib/utils';
import { useDashboardStore } from '@/store/dashboardStore';
import TabsBilling from '@/components/billing/TabsBilling';
import TabsServices from '@/components/billing/TabsServices';
import { GetAuthContext } from '@/contexts/auth/GetAuthContext';

const DashPage: React.FC = () => {
  console.log("Dash");

  const { user } = GetAuthContext();

  const setDashLoaded = useDashboardStore((state) => state.setDashLoaded);
  const dashLoaded = useDashboardStore((state) => state.dashLoaded);  

  const fetchInvoices = useDashboardStore((state) => state.fetchInvoices);
  const fetchPayments = useDashboardStore((state) => state.fetchPayments);
  const fetchProducts = useDashboardStore((state) => state.fetchProducts);
  const fetchUserProfile = useDashboardStore((state) => state.fetchUserProfile);
  
  useEffect(() => {
    
    if (user && !dashLoaded) { // !!
      fetchUserProfile();
      fetchInvoices();
      fetchPayments();
      fetchProducts();

      setDashLoaded(true);
    }

  }, [user]); //though user may be the same, the ref changes, so we use dashLoaded for ensuring the dash loads once, we may create a protected route wrapper
  return (
    <AnimatePresence>
      <motion.div {...motionFadeUp}>
        <div className="mx-auto pb-0 space-y-6 md:space-y-8">
          <TabsServices />
          <PaymentMethods />
          <TabsBilling />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DashPage;

