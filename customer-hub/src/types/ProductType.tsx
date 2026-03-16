export type Product = {
    id: string;
    reference: string;
    church_id: string;
    product_stripe_id: string | null;
    product_quickbooks_id: string | null;
    campus_id: string | null;
    name: string;
    price: number;
    created_at: string;
    trash: string;
    slug: string | null;
    client_id: string;
    recurrence: 'O' | 'R'; //one time or recurring
    billing_period: string | null;
    custom_date: string | null;
    start_subscription: string;
    file_hash: string | null;
    description: string | null;
}

export type ProductCart = Product & { _quantity: number };

