import { apiPrivate } from "./api";
import { ProductCart } from "@/types/ProductType";

type NonEmptyArray<T> = [T, ...T[]];
type PaymentOptions = NonEmptyArray<"CC" | "BANK">;

export type PaymentLinkCreate = {
  products: {
    product_id: string;
    product_name: string;
    product_price: number;
    editable: 'false';
    quantity: number;
  }[];
  organization_id: string;
  payment_options: PaymentOptions;
  cover_fee: '0' | '1';
};


export const dummyPaymentLinkCreateData: PaymentLinkCreate = {
  products: [
    {
      product_id: '',
      product_name: '',
      product_price: 0,
      editable: 'false',
      quantity: 0,
    },
  ],
  organization_id: '',
  payment_options: ["CC", "BANK"],
  cover_fee: '0'
};

export const buildPaymentLinkDataFromCart = (orgId: string, productsCart: ProductCart[]) : PaymentLinkCreate => {
  const data = {
    products: productsCart?.map((product: ProductCart) => (
      {
        product_id: product.id,
        product_name: product.name,
        product_price: product.price,
        editable: 'false' as const,
        quantity: product._quantity,
      }
    )) || [],
    organization_id: orgId,
    payment_options: ["CC", "BANK"] as PaymentOptions,
    cover_fee: '0' as const
  };

  return data;
};

export const createPaymentLink = async (payload: PaymentLinkCreate) => {
  try {
    const response = await apiPrivate.post("/payment_link/create", payload);
    return response;
  } catch (error) {
    throw error;
  }
};