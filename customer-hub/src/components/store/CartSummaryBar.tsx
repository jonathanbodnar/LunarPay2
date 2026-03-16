import { Link } from 'react-router-dom';
import { useShopStore } from '@/store/shopStore';
import { Button } from '@/components/ui/button';
import { FaCartShopping } from 'react-icons/fa6';
import { useEffect, useState } from 'react';

interface CartSummaryBarProps {
    tenantSlug: string;
}

const CartSummaryBar: React.FC<CartSummaryBarProps> = ({ tenantSlug }) => {
    const cartCount = useShopStore((s) => s.cartCount);
    const [animate, setAnimate] = useState(false);
  
    useEffect(() => {
      if (cartCount > 0) {
        setAnimate(true);
        const timeout = setTimeout(() => setAnimate(false), 300); // duration of the animation
        return () => clearTimeout(timeout);
      }
    }, [cartCount]);
  
    if (cartCount === 0) return null;
  
    return (
      <div className="flex justify-end items-center gap-4 bg-secondary opacity-95 shadow-lg rounded-t-lg h-15 px-5">
        <div className="flex items-center gap-2 text-md font-extrabold ">
          <FaCartShopping className="text-muted-foreground" />
          <span
            className={`transition-transform duration-300 ${animate ? 'scale-110' : ''
              }`}
          >
            {cartCount} item{cartCount > 1 ? 's' : ''} in your plan
          </span>
        </div>

        <Link to={`/${tenantSlug}/checkout`}>
          <Button variant="default" className="font-extrabold" size="sm">Checkout</Button>
        </Link>
      </div>
    );
  };
export default CartSummaryBar;
