import LoaderSmall from "../ui/loader-small";
import { useEffect } from "react";
import { useShopStore } from "@/store/shopStore";
import { ProductItem } from "./ProductItem";

// ProductList Component
export const ProductList: React.FC<{ tenantSlug: string }> = ({ tenantSlug }) => {

    const products = useShopStore((s) => s.products);
    const loading = useShopStore((s) => s.productsLoading);
    const loaded = useShopStore((s) => s.productsLoaded);
    const setProductsLoaded = useShopStore((s) => s.setProductsLoaded);
    const fetchAvailableProducts = useShopStore((s) => s.fetchAvailableProducts);

    useEffect(() => {
        if (!loaded) {
            fetchAvailableProducts(tenantSlug);
            setProductsLoaded(true);
        }
    }, []);

    if (loading) return <LoaderSmall />;

    if (!products || products.length === 0) return <p>No items found.</p>;

    return (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {products.map((item) => (
                <ProductItem
                    key={item.id}
                    item={item}                    
                />
            ))}
        </ul>
    );
};

