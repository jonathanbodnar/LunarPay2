import { AnimatePresence, motion } from 'motion/react';
import { motionFadeUp } from '@/lib/utils';
import CartSummaryBar from '@/components/store/CartSummaryBar';
import { ProductList } from '@/components/store/ProductList';

// Main Shop Component
const ShopPage: React.FC<{ tenantSlug: string }> = ({ tenantSlug }) => {
  
  return (
    <>
      <AnimatePresence>
        <motion.div {...motionFadeUp}>
          <div className="relative">
            <div className="px-2 pb-6 max-w-7xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">Customize Your Package</h2>
              <p className="text-muted-foreground mb-8 text-sm md:text-base">
                One-time or ongoing, choose what fits and bundle it all together.
              </p>
              <ProductList tenantSlug={tenantSlug} />
            </div>
            <div className="sticky bottom-0 left-0 right-0 z-50 w-full max-w-7xl mx-auto  ">
              <CartSummaryBar tenantSlug={tenantSlug} />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default ShopPage;





