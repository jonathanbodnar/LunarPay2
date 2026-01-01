// Fortis API Types
// Based on Fortis API v1 documentation and current LunarPay implementation

export interface FortisConfig {
  environment: 'sandbox' | 'production';
  developerId: string;
  userId: string;
  userApiKey: string;
}

// Merchant Onboarding Types
// Full list of fields supported by Fortis API for pre-filling MPA form
export interface MerchantOnboardingData {
  // Primary Principal (Owner) - Required
  primary_principal: {
    first_name: string;
    last_name: string;
    phone_number: string;
    // Optional owner details to pre-fill MPA (non-PCI fields only)
    email?: string;
    title?: string; // Job title (e.g., "Owner", "CEO")
    ownership_percent?: number; // 1-100
    date_of_birth?: string; // YYYY-MM-DD format
    // NOTE: SSN is collected by Fortis in their secure MPA iframe, not by us
    // Owner's home address
    address_line_1?: string;
    address_line_2?: string;
    city?: string;
    state_province?: string;
    postal_code?: string;
    country?: string; // Default: "US"
  };
  
  // Business contact email
  email: string;
  
  // Business names
  dba_name: string;
  legal_name: string;
  
  // Business details
  template_code: string;
  website: string;
  fed_tax_id?: string; // Federal Tax ID / EIN
  ownership_type?: 'llc' | 'llp' | 'corporation' | 'sole_proprietorship' | 'partnership' | 'non_profit';
  business_category?: string; // MCC code or category
  
  // Estimated volumes (helps with underwriting)
  annual_revenue?: number; // Estimated annual revenue in cents
  cc_monthly_volume?: number; // Monthly CC volume in cents
  ach_monthly_volume?: number; // Monthly ACH volume in cents
  average_ticket?: number; // Average transaction amount in cents
  highest_ticket?: number; // Highest expected transaction in cents
  
  // Business location
  location: {
    address_line_1: string;
    address_line_2?: string;
    city: string;
    state_province: string;
    postal_code: string;
    country?: string; // Default: "US"
    phone_number: string;
  };
  
  // Application delivery method
  app_delivery: 'link_iframe' | 'link_full_page';
  
  // Bank accounts for deposits
  bank_account: {
    routing_number: string;
    account_number: string;
    account_holder_name: string;
    account_type?: 'checking' | 'savings';
  };
  alt_bank_account: {
    routing_number: string;
    account_number: string;
    account_holder_name: string;
    account_type?: 'checking' | 'savings';
  };
  
  // Contact information
  contact: {
    first_name?: string;
    last_name?: string;
    phone_number: string;
    email?: string;
  };
  
  // Client reference ID (our organization ID)
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

