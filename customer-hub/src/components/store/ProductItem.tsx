import { formatDate, formatMoney } from "@/lib/utils";
import { useShopStore } from "@/store/shopStore";
import { Product } from "@/types/ProductType";
import { ProductActions } from "./ProductActions";

type CssProps = {
    border?: boolean;
};

export const ProductItem: React.FC<{ item: Product; css?: CssProps}> = ({ item, css }) => {
    const cart = useShopStore((s) => s.cart);
    const addToCart = useShopStore((s) => s.addToCart);
    const removeFromCart = useShopStore((s) => s.removeFromCart);

    return (
        <li className={`w-full max-w-full p-5 shadow-sm hover:shadow-md transition-all ${css?.border !== false ? 'border rounded-sm' : ''}`}>
            
            <div className="flex flex-col space-y-4 h-full">
                <span className="text-xs font-semibold tracking-wide">
                    {item.recurrence === 'R' ? <>
                        <span className="uppercase">Subscription</span>
                        <span className="text-sm font-normal capitalize"> / {item.billing_period}</span>
                    
                    </> : <span className="uppercase">One-time payment</span>}
                </span>

                <div>
                    <h3 className="text-xl font-semibold">{item.name}</h3>
                    <p className="text-lg font-bold">{formatMoney(item.price)}</p>                    
                </div>

                {item.description && (
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                )}

                <div className="grid gap-y-4 mt-auto">
                    <p className="text-sm text-muted-foreground mt-auto">
                        Added on {formatDate(item.created_at)}
                    </p>
                
                    <ProductActions
                        item={item}
                        cart={cart}
                        addToCart={addToCart}
                        removeFromCart={removeFromCart}                          
                    />
                </div>
            </div>
        </li>
    );
};


