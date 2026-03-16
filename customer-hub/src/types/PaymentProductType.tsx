export type PaymentProduct = {
    id: string;
    product_name: string;
    quantity: number;
    price: number;
    digital_content_url: string;
};

export type PaymentWithProducts = {
    id: string;
    amount: string;
    fee: string;
    net: string;
    created_at: string;
    invoice_id: string | null;
    payment_link_id: string | null;
    payment_link_products: PaymentProduct[] | null;
    invoice_products: PaymentProduct[] | null;
}

