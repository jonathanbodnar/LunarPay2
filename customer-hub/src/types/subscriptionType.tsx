export type Subscription = {
    id: string;
    account_donor_id: string;
    church_id: string;
    campus_id: string | null;
    amount: string;
    frequency: string;
    is_fee_covered: string;
    start_on: string;
    created_at: string;
    updated_at: string;
    cancelled_at: string | null;
    funds_name: string;
    white_label_tag: string | null;
    last_digits: string;
    payment_method: string;
    src_account_type: string;
    name_holder: string;
    next_payment_on: string;
    product_name: string;
    
  };
