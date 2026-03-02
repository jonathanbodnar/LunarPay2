export type PaymentMethod = {
  id: string;
  account_donor_id: string;
  church_id: string;
  customer_id: string;
  postal_code: string | null;
  source_type: string;
  src_account_type: string;
  exp_month: string;
  exp_year: string;
  last_digits: string;
  name_holder: string;
  created_at: string;
  updated_at: string;
  epicpay_wallet_id: string;  
};

