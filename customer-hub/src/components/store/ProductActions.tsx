import { GoPlus, GoTrash } from "react-icons/go";
import { Button } from "../ui/button";
import { Product, ProductCart } from "@/types/ProductType";
import { Badge } from "../ui/badge";

// ProductActions Component
export const ProductActions: React.FC<{
    item: Product;
    cart: ProductCart[] | null;
    addToCart: (item: Product) => void;
    removeFromCart: (item: Product) => void;    
}> = ({ item, cart, addToCart, removeFromCart }) => {
    
    const productCart = cart?.find((p) => p.id === item.id);

    if (productCart) {
        return (
            <div className="flex items-center gap-4">
                <Button
                    variant="outline"
                    className="w-12 py-2 text-sm"
                    onClick={() => removeFromCart(item)}
                    title="Remove item from cart"
                >
                    <GoTrash />
                </Button>

                <Badge className="ml-auto px-4 py-2 text-sm font-bold rounded-lg" variant="outline">{productCart._quantity}</Badge>
                
                {productCart._quantity &&
                    <Button
                        variant="outline"
                        className="border py-2 font-medium text-sm font-extrabold"
                        onClick={() => {
                            addToCart(item)
                        }}
                        title="Add another to cart"
                    >
                        Add more <GoPlus />
                    </Button>
                }
            </div>
        );
    }

    return (
        <Button
            variant="secondary"
            className="w-full border py-2 font-medium text-sm font-extrabold"
            onClick={() => {
                addToCart(item)
            }}
            title="Add item to cart"

        >
            Add to plan
        </Button>
    );
};
