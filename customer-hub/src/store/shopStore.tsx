import { errorHandler } from "@/services/api";
import { toast } from "sonner";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { Product, ProductCart } from "@/types/ProductType";
import { getAvailableProducts } from "@/services/productsService";

type shopDataState = {  
  fetchAvailableProducts: (tenantSlug: string) => Promise<void>;
  addToCart: (product: Product) => void;
  removeFromCart: (product: Product) => void;
  resetCart: () => void
  productsLoading: boolean;
  productsLoaded: boolean;
  products: Product[] | null
  cart: ProductCart[] | null
  cartCount: number
  total: number;
  setProductsLoaded: (loaded: boolean) => void
}

export const useShopStore = create<shopDataState>()(
  persist(
    (set) => ({
      products: null,
      cart: null,
      productsLoading: false,
      productsLoaded: false,
      cartCount: 0,
      total: 0,

      setProductsLoaded: (loaded: boolean) => {
        set({ productsLoaded: loaded });
      },

      fetchAvailableProducts: async (tenantSlug: string) => {
        set({ productsLoading: true });
        try {
          const res = await getAvailableProducts(tenantSlug);
          if (res?.data?.response?.status) {
            set({ products: res.data.response.data, productsLoaded: true });
          } else {
            toast.error(errorHandler(res));
          }
        } catch (err: any) {
          toast.error(errorHandler(err));
        } finally {
          set({ productsLoading: false });
        }
      },

      addToCart: (product: Product) => {
        set((state) => {
          
          const existingItem = state.cart?.find((item) => item.id === product.id);
          const updatedCart = existingItem
            ? state.cart?.map((item) =>
                item.id === product.id ? { ...item, _quantity: item._quantity + 1 } : item
              ) || []
            : [...(state.cart || []), { ...product, _quantity: 1 }];

          const total = updatedCart.reduce((acc, item) => acc + (item.price * item._quantity), 0);

          return {
            cart: updatedCart,
            cartCount: state.cartCount + 1,
            total
          };
        })
      },

      removeFromCart: (product: Product) => {
        set((state) => {
          if (!state.cart) return state;

          const existingItem = state.cart?.find((item) => item.id === product.id);
          if (!existingItem) return state;
          
      
          if (existingItem._quantity > 1) {
            const updatedCart = state.cart.map((item) =>
              item.id === product.id ? { ...item, _quantity: item._quantity - 1 } : item
            );
            
            const total = updatedCart.reduce((acc, item) => acc + (item.price * item._quantity), 0);

            return {
              cart: updatedCart,
              cartCount: Math.max(state.cartCount - 1, 0),
              total
            };
          } else {
            const updatedCart = state.cart.filter((item) => item.id !== product.id);
            const total = updatedCart.reduce((acc, item) => acc + (item.price * item._quantity), 0);

            return {
              cart: updatedCart.length ? updatedCart : null,
              cartCount: Math.max(state.cartCount - 1, 0),
              total
            };
          }
        });
      },

      resetCart: () => {
        set({ cart: null, cartCount: 0 });
      },
    }),
    {
      name: "shop-storage", // Key in localStorage
      partialize: (state) => ({
        cart: state.cart,
        cartCount: state.cartCount,
        total: state.total
      }),
    }
  )
);