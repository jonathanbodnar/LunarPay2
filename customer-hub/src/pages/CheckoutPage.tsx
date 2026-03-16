import { AnimatePresence, motion } from 'motion/react';
import { motionFadeUp } from '@/lib/utils';
import Checkout from '@/components/store/Checkout';

// Main Shop Component
type CheckoutPageProps = {
  tenantSlug: string
};
const CheckoutPage: React.FC<CheckoutPageProps>= ({tenantSlug}) => {
  return (
    <>
      <AnimatePresence>
        <motion.div {...motionFadeUp}>
          <Checkout tenantSlug={tenantSlug} />
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default CheckoutPage;





