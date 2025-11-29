// Fortis API Types
// Based on Fortis API v1 documentation and current LunarPay implementation

export interface FortisConfig {
  environment: 'sandbox' | 'production';
  developerId: string;
  userId: string;
  userApiKey: string;
}

// Merchant Onboarding Types
export interface MerchantOnboardingData {
  primary_principal: {
    first_name: string;
    last_name: string;
    phone_number: string;
  };
  email: string;
  dba_name: string;
  template_code: string;
  website: string;
  location: {
    address_line_1: string;
    state_province: string;
    city: string;
    postal_code: string;
    phone_number: string;
  };
  app_delivery: 'link_iframe' | 'link_full_page';
  bank_account: {
    routing_number: string;
    account_number: string;
    account_holder_name: string;
  };
  alt_bank_account: {
    routing_number: string;
    account_number: string;
    account_holder_name: string;
  };
  legal_name: string;
  contact: {
    phone_number: string;
  };
  client_app_id: string;
}

export interface OnboardingResponse {
  type: 'Onboarding' | 'Error';
  data?: {
    primary_principal: {
      first_name: string;
    };
    template_code: string;
    email: string;
    dba_name: string;
    client_app_id: string;
    app_link: string;
  };
  detail?: string;
}

// Transaction Intention Types
export interface TransactionIntentionData {
  location_id: string;
  contact_id?: string;
  product_transaction_id?: string;
  action: 'sale' | 'avsonly' | 'authonly';
  amount?: number; // in cents, required for 'sale'
}

export interface TransactionIntentionResponse {
  data: {
    client_token: string;
  };
}

// Transaction Types
export interface CreditCardSaleData {
  transaction_amount: number; // in cents
  token_id: string; // saved wallet/token ID
  client_customer_id?: string;
  transaction_c1?: string; // custom field 1
  transaction_c2?: string; // custom field 2
}

export interface ACHDebitData {
  transaction_amount: number; // in cents
  token_id: string;
  client_customer_id?: string;
  transaction_c1?: string;
  transaction_c2?: string;
}

export interface TransactionResponse {
  data: {
    id: string; // Fortis transaction ID
    status_code: number;
    reason_code_id: number;
    transaction_amount: number;
    auth_amount: number;
    transaction_batch_id?: string;
    created_ts: number;
    reason_code?: string;
  };
}

// Refund Types
export interface RefundData {
  transaction_amount: number; // in cents
}

export interface RefundResponse {
  data: {
    id: string;
    status_code: number;
    transaction_amount: number;
    type_id: string;
  };
}

// Webhook Types
export interface FortisWebhookPayload {
  client_app_id: string;
  stage: 'sandbox' | 'production';
  users?: Array<{
    user_id: string;
    user_api_key: string;
  }>;
}

// Reason Codes
export const FORTIS_REASON_CODES: Record<string, string> = {
  '0': 'N/A',
  '1000': 'CC - Approved / ACH - Accepted',
  '1001': 'AuthCompleted',
  '1002': 'Forced',
  '1003': 'AuthOnly Declined',
  '1500': 'Generic Decline',
  '1510': 'Call',
  '1520': 'Pickup Card',
  '1616': 'NSF',
  '1622': 'Card Expired',
  '1625': 'Card Not Permitted',
  '1626': 'Trans Not Permitted',
  '1660': 'Bank Account Error, please delete and re-add Token',
  '2101': 'Insufficient funds',
  '2102': 'Bank account closed',
  '2103': 'No bank account/unable to locate account',
  '2104': 'Invalid bank account number',
  '2107': 'Authorization revoked by customer',
  '2108': 'Payment stopped',
  // Add more as needed
};

// Payment Source Types
export type PaymentSource = 'CC' | 'BNK';
export type PaymentMethod = 'credit_card' | 'echeck' | 'wallet';
export type TransactionStatus = 'P' | 'N' | 'R'; // Pending/Success, Failed, Refunded
export type ACHStatus = 'W' | 'P' | 'F'; // Waiting, Processed, Failed

