# LunarPay - Technical Reference Guide

## Table of Contents
1. [Database Schema Reference](#database-schema-reference)
2. [API Specifications](#api-specifications)
3. [Code Examples](#code-examples)
4. [Helper Functions](#helper-functions)
5. [Payment Gateway Implementation](#payment-gateway-implementation)
6. [Webhook Handling](#webhook-handling)
7. [Widget Integration Guide](#widget-integration-guide)
8. [Testing Guidelines](#testing-guidelines)

---

## Database Schema Reference

### Core Tables Detail

#### `church` (Organizations)
```sql
CREATE TABLE church (
  ch_id INT AUTO_INCREMENT PRIMARY KEY,
  church_name VARCHAR(255),
  phone_no VARCHAR(50),
  website VARCHAR(255),
  street_address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  postal VARCHAR(20),
  token VARCHAR(255) UNIQUE,
  created_at DATETIME,
  updated_at DATETIME,
  INDEX idx_token (token)
);
```

**Key Fields:**
- `ch_id` - Primary key, organization identifier
- `token` - Unique token for widget/API access
- Used in: Organizations, Funds, Invoices, Donations

#### `campuses` (Sub-Organizations)
```sql
CREATE TABLE campuses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  church_id INT,
  name VARCHAR(255),
  address TEXT,
  phone VARCHAR(50),
  pastor VARCHAR(255),
  description TEXT,
  slug VARCHAR(255) UNIQUE,
  created_at DATETIME,
  FOREIGN KEY (church_id) REFERENCES church(ch_id),
  INDEX idx_church (church_id),
  INDEX idx_slug (slug)
);
```

#### `users` (Admin Users)
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ip_address VARCHAR(45),
  username VARCHAR(100),
  password VARCHAR(255),
  email VARCHAR(254) UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(50),
  payment_processor VARCHAR(10), -- 'EPP', 'PSF', 'FTS', 'ETH'
  active TINYINT(1) DEFAULT 1,
  created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  -- OAuth fields
  stripe_oauth TEXT,
  quickbooks_oauth TEXT,
  freshbooks_oauth TEXT,
  slack_oauth TEXT,
  slack_channel VARCHAR(255),
  state_slack VARCHAR(50),
  INDEX idx_email (email)
);
```

#### `account_donor` (Customers/Donors)
```sql
CREATE TABLE account_donor (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT, -- user_id who owns this record
  church_id INT,
  campus_id INT,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(254),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip VARCHAR(20),
  country VARCHAR(50),
  created_from VARCHAR(50), -- 'widget', 'invoice', 'manual', etc.
  created_at DATETIME,
  -- Integration IDs
  stripe_customer_id VARCHAR(255),
  quickbooks_id VARCHAR(255),
  freshbooks_id VARCHAR(255),
  FOREIGN KEY (church_id) REFERENCES church(ch_id),
  INDEX idx_email (email),
  INDEX idx_church (church_id),
  INDEX idx_client (client_id)
);
```

#### `transactions_funds` (Donations/Transactions)
```sql
CREATE TABLE transactions_funds (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT, -- admin user
  donor_id INT,
  church_id INT,
  campus_id INT,
  amount DECIMAL(10,2),
  fee DECIMAL(10,2),
  net DECIMAL(10,2),
  src VARCHAR(10), -- 'CC', 'ACH', 'ETH'
  status VARCHAR(10), -- 'P' (Pending), 'S' (Success), 'F' (Failed)
  trx_type VARCHAR(50), -- 'Donation', 'Refunded', 'Recovered', etc.
  giving_source VARCHAR(50), -- 'widget', 'invoice', 'payment_link', 'mobile'
  transaction_detail TEXT,
  date DATETIME,
  subscription_id INT,
  invoice_id INT,
  payment_link_id INT,
  batch_id INT,
  manual_failed TINYINT(1) DEFAULT 0,
  manual_trx_type VARCHAR(50),
  status_ach VARCHAR(50),
  receipt_file_uri VARCHAR(500),
  -- Integration tracking
  quickbooks_pushed TINYINT(1) DEFAULT 0,
  quickbooks_last_update DATETIME,
  freshbooks_pushed TINYINT(1) DEFAULT 0,
  freshbooks_last_update DATETIME,
  FOREIGN KEY (donor_id) REFERENCES account_donor(id),
  FOREIGN KEY (church_id) REFERENCES church(ch_id),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  INDEX idx_donor (donor_id),
  INDEX idx_date (date),
  INDEX idx_status (status),
  INDEX idx_subscription (subscription_id)
);
```

#### `fund` (Fund Categories)
```sql
CREATE TABLE fund (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  church_id INT,
  campus_id INT,
  name VARCHAR(255),
  description TEXT,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME,
  FOREIGN KEY (church_id) REFERENCES church(ch_id),
  INDEX idx_church (church_id),
  INDEX idx_active (is_active)
);
```

#### `invoices`
```sql
CREATE TABLE invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  church_id INT,
  campus_id INT,
  donor_id INT,
  status VARCHAR(20), -- 'draft', 'finalized', 'sent', 'paid', 'partial', 'overdue', 'archived'
  total_amount DECIMAL(10,2),
  paid_amount DECIMAL(10,2) DEFAULT 0,
  due_date DATE,
  reference VARCHAR(100),
  memo TEXT,
  footer TEXT,
  comment TEXT,
  payment_options VARCHAR(20), -- 'cc', 'ach', 'both'
  cover_fee TINYINT(1) DEFAULT 0,
  hash VARCHAR(255) UNIQUE,
  pdf_url VARCHAR(500),
  post_purchase_link TEXT,
  created_at DATETIME,
  finalized_at DATETIME,
  -- Integration IDs
  stripe_id VARCHAR(255),
  quickbooks_id VARCHAR(255),
  freshbooks_id VARCHAR(255),
  FOREIGN KEY (donor_id) REFERENCES account_donor(id),
  FOREIGN KEY (church_id) REFERENCES church(ch_id),
  INDEX idx_hash (hash),
  INDEX idx_donor (donor_id),
  INDEX idx_status (status)
);
```

#### `invoice_products` (Invoice Line Items)
```sql
CREATE TABLE invoice_products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT,
  product_id INT,
  product_name VARCHAR(255),
  qty INT,
  price DECIMAL(10,2),
  subtotal DECIMAL(10,2),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_invoice (invoice_id)
);
```

#### `products`
```sql
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  church_id INT,
  campus_id INT,
  name VARCHAR(255),
  description TEXT,
  price DECIMAL(10,2),
  qty INT, -- NULL = unlimited
  slug VARCHAR(255),
  reference VARCHAR(100),
  trash TINYINT(1) DEFAULT 0,
  -- Digital content
  file_hash VARCHAR(500),
  -- Subscription fields
  is_subscription TINYINT(1) DEFAULT 0,
  subscription_interval VARCHAR(20), -- 'daily', 'weekly', 'monthly', 'yearly'
  subscription_interval_count INT,
  subscription_trial_days INT,
  start_subscription_custom_date DATE,
  custom_date TINYINT(1) DEFAULT 0,
  -- Integration IDs
  id_stripe VARCHAR(255),
  id_quickbooks VARCHAR(255),
  created_at DATETIME,
  FOREIGN KEY (church_id) REFERENCES church(ch_id),
  INDEX idx_church (church_id),
  INDEX idx_slug (slug),
  INDEX idx_trash (trash)
);
```

#### `payment_links`
```sql
CREATE TABLE payment_links (
  id INT AUTO_INCREMENT PRIMARY KEY,
  church_id INT,
  campus_id INT,
  name VARCHAR(255),
  description TEXT,
  status VARCHAR(20), -- 'active', 'inactive'
  hash VARCHAR(255) UNIQUE,
  payment_methods VARCHAR(20), -- 'cc', 'ach', 'both'
  created_at DATETIME,
  FOREIGN KEY (church_id) REFERENCES church(ch_id),
  INDEX idx_hash (hash),
  INDEX idx_church (church_id),
  INDEX idx_status (status)
);
```

#### `payment_link_products`
```sql
CREATE TABLE payment_link_products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payment_link_id INT,
  product_id INT,
  qty INT, -- NULL = unlimited
  unlimited_qty TINYINT(1) DEFAULT 0,
  FOREIGN KEY (payment_link_id) REFERENCES payment_links(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_payment_link (payment_link_id)
);
```

#### `payment_link_products_paid`
```sql
CREATE TABLE payment_link_products_paid (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payment_link_product_id INT,
  transaction_id BIGINT,
  subscription_id INT,
  qty INT,
  paid_at DATETIME,
  FOREIGN KEY (payment_link_product_id) REFERENCES payment_link_products(id),
  FOREIGN KEY (transaction_id) REFERENCES transactions_funds(id),
  INDEX idx_transaction (transaction_id)
);
```

#### `subscriptions`
```sql
CREATE TABLE subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  donor_id INT,
  church_id INT,
  campus_id INT,
  product_id INT,
  payment_link_id INT,
  amount DECIMAL(10,2),
  frequency VARCHAR(20), -- 'weekly', 'monthly', 'quarterly', 'yearly'
  status VARCHAR(20), -- 'active', 'paused', 'cancelled'
  source_id INT, -- saved payment source
  next_billing_date DATE,
  last_billing_date DATE,
  processor_subscription_id VARCHAR(255),
  traxn_count INT DEFAULT 0,
  created_at DATETIME,
  FOREIGN KEY (donor_id) REFERENCES account_donor(id),
  INDEX idx_donor (donor_id),
  INDEX idx_status (status),
  INDEX idx_next_billing (next_billing_date)
);
```

#### `sources` (Saved Payment Methods)
```sql
CREATE TABLE sources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  donor_id INT,
  type VARCHAR(10), -- 'CC', 'ACH'
  last_four VARCHAR(4),
  brand VARCHAR(50), -- 'Visa', 'MasterCard', etc.
  exp_month INT,
  exp_year INT,
  processor_source_id VARCHAR(255),
  is_default TINYINT(1) DEFAULT 0,
  created_at DATETIME,
  FOREIGN KEY (donor_id) REFERENCES account_donor(id),
  INDEX idx_donor (donor_id)
);
```

#### `batches`
```sql
CREATE TABLE batches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT,
  church_id INT,
  campus_id INT,
  status VARCHAR(20), -- 'draft', 'committed'
  committed_at DATETIME,
  created_at DATETIME,
  FOREIGN KEY (church_id) REFERENCES church(ch_id),
  INDEX idx_client (client_id),
  INDEX idx_status (status)
);
```

#### `tags`
```sql
CREATE TABLE tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT,
  name VARCHAR(100),
  created_at DATETIME,
  INDEX idx_client (client_id)
);
```

#### `batch_tags`
```sql
CREATE TABLE batch_tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  batch_id INT,
  tag_id INT,
  client_id INT,
  FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id),
  INDEX idx_batch (batch_id)
);
```

#### `statements`
```sql
CREATE TABLE statements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(20), -- 'EPIC', 'PSF', 'FTS'
  client_id INT,
  church_id INT,
  created_by VARCHAR(1), -- 'A' (Admin), 'D' (Donor)
  date_from DATE,
  date_to DATE,
  file_name VARCHAR(500),
  created_at DATETIME,
  FOREIGN KEY (church_id) REFERENCES church(ch_id),
  INDEX idx_client (client_id),
  INDEX idx_dates (date_from, date_to)
);
```

#### `statement_donor`
```sql
CREATE TABLE statement_donor (
  id INT AUTO_INCREMENT PRIMARY KEY,
  statement_id INT,
  donor_id INT,
  file_name VARCHAR(500),
  created_at DATETIME,
  FOREIGN KEY (statement_id) REFERENCES statements(id) ON DELETE CASCADE,
  FOREIGN KEY (donor_id) REFERENCES account_donor(id),
  INDEX idx_statement (statement_id),
  INDEX idx_donor (donor_id)
);
```

### Onboarding Tables

#### `church_onboard`
```sql
CREATE TABLE church_onboard (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  church_id INT,
  status VARCHAR(20),
  created_at DATETIME,
  FOREIGN KEY (church_id) REFERENCES church(ch_id)
);
```

#### `church_onboard_paysafe`
```sql
CREATE TABLE church_onboard_paysafe (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  church_id INT,
  account_id VARCHAR(255), -- PaySafe merchant account ID
  owner_email VARCHAR(255),
  owner_first_name VARCHAR(100),
  owner_last_name VARCHAR(100),
  owner2_email VARCHAR(255),
  owner2_first_name VARCHAR(100),
  owner2_last_name VARCHAR(100),
  status VARCHAR(20),
  created_at DATETIME,
  FOREIGN KEY (church_id) REFERENCES church(ch_id)
);
```

#### `church_onboard_fortis`
```sql
CREATE TABLE church_onboard_fortis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  church_id INT,
  location_id VARCHAR(255),
  product_transaction_id VARCHAR(255),
  merchant_account_active TINYINT(1) DEFAULT 0,
  status VARCHAR(20),
  created_at DATETIME,
  FOREIGN KEY (church_id) REFERENCES church(ch_id)
);
```

#### `church_onboard_crypto`
```sql
CREATE TABLE church_onboard_crypto (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  church_id INT,
  wallet_address VARCHAR(255),
  api_key TEXT,
  active TINYINT(1) DEFAULT 1,
  created_at DATETIME,
  FOREIGN KEY (church_id) REFERENCES church(ch_id)
);
```

### Webhook Tables

#### `paysafe_webhooks`
```sql
CREATE TABLE paysafe_webhooks (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_type VARCHAR(100),
  payload TEXT,
  processed TINYINT(1) DEFAULT 0,
  received_at DATETIME,
  processed_at DATETIME,
  INDEX idx_processed (processed),
  INDEX idx_event (event_type)
);
```

#### `fortis_webhooks`
```sql
CREATE TABLE fortis_webhooks (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_type VARCHAR(100),
  resource_type VARCHAR(50),
  payload TEXT,
  processed TINYINT(1) DEFAULT 0,
  received_at DATETIME,
  processed_at DATETIME,
  INDEX idx_processed (processed),
  INDEX idx_event (event_type)
);
```

### Chat/Messaging Tables

#### `chat`
```sql
CREATE TABLE chat (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT,
  church_id INT,
  campus_id INT,
  name VARCHAR(255),
  description TEXT,
  is_public TINYINT(1) DEFAULT 0,
  created_at DATETIME,
  INDEX idx_church (church_id)
);
```

#### `chat_settings`
```sql
CREATE TABLE chat_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT,
  church_id INT,
  campus_id INT,
  logo_url VARCHAR(500),
  primary_color VARCHAR(20),
  secondary_color VARCHAR(20),
  widget_location VARCHAR(20), -- 'bottom-right', 'bottom-left', etc.
  created_at DATETIME,
  updated_at DATETIME,
  FOREIGN KEY (church_id) REFERENCES church(ch_id),
  UNIQUE KEY unique_org (church_id, campus_id)
);
```

#### `history_chat`
```sql
CREATE TABLE history_chat (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  chat_id INT,
  donor_id INT,
  message TEXT,
  direction VARCHAR(10), -- 'inbound', 'outbound'
  status VARCHAR(20), -- 'active', 'archived'
  created_at DATETIME,
  FOREIGN KEY (chat_id) REFERENCES chat(id),
  FOREIGN KEY (donor_id) REFERENCES account_donor(id),
  INDEX idx_chat (chat_id),
  INDEX idx_status (status)
);
```

### Other Tables

#### `pages`
```sql
CREATE TABLE pages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  church_id INT,
  campus_id INT,
  title VARCHAR(255),
  slug VARCHAR(255),
  content TEXT,
  trash TINYINT(1) DEFAULT 0,
  created_at DATETIME,
  INDEX idx_slug (slug),
  INDEX idx_trash (trash)
);
```

#### `settings`
```sql
CREATE TABLE settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  key_name VARCHAR(100) UNIQUE,
  value TEXT,
  updated_at DATETIME
);
```

#### `api_session`
```sql
CREATE TABLE api_session (
  id VARCHAR(128) PRIMARY KEY,
  data TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_updated (updated_at)
);
```

#### `api_keys_merchant`
```sql
CREATE TABLE api_keys_merchant (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  church_id INT,
  api_key VARCHAR(255) UNIQUE,
  token VARCHAR(500),
  active TINYINT(1) DEFAULT 1,
  created_at DATETIME,
  FOREIGN KEY (church_id) REFERENCES church(ch_id),
  INDEX idx_api_key (api_key)
);
```

#### `referrals`
```sql
CREATE TABLE referrals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  referrer_user_id INT,
  referred_user_id INT,
  share_code VARCHAR(100) UNIQUE,
  status VARCHAR(20), -- 'pending', 'completed'
  month_date DATE,
  created_at DATETIME,
  FOREIGN KEY (referrer_user_id) REFERENCES users(id),
  FOREIGN KEY (referred_user_id) REFERENCES users(id),
  INDEX idx_share_code (share_code)
);
```

---

## API Specifications

### Customer API v1

**Base URL**: `/customer/apiv1/`  
**Authentication**: Token-based (Ion Auth session)

#### 1. Authentication

##### Login
```
POST /customer/apiv1/auth/login
Content-Type: application/json

Request:
{
  "identity": "user@example.com",
  "password": "password123",
  "remember": true
}

Response (Success):
{
  "status": true,
  "message": "Login successful",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}

Response (Failure):
{
  "status": false,
  "message": "Invalid credentials"
}
```

##### Logout
```
POST /customer/apiv1/auth/logout

Response:
{
  "status": true,
  "message": "Logged out successfully"
}
```

#### 2. Invoices

##### Get Invoice by Hash
```
GET /customer/apiv1/invoice/{hash}

Response:
{
  "status": true,
  "invoice": {
    "id": 456,
    "church_id": 10,
    "donor_id": 123,
    "status": "finalized",
    "total_amount": "150.00",
    "paid_amount": "0.00",
    "due_date": "2024-12-31",
    "reference": "INV-001",
    "memo": "Website services",
    "products": [
      {
        "id": 1,
        "name": "Web Design",
        "qty": 1,
        "price": "150.00",
        "subtotal": "150.00"
      }
    ],
    "customer": {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com"
    }
  }
}
```

##### Pay Invoice
```
POST /customer/apiv1/pay/invoice
Content-Type: application/json

Request:
{
  "invoice_hash": "abc123def456",
  "source_id": 789, // saved payment source ID
  "amount": 150.00,
  "cover_fee": false
}

Response (Success):
{
  "status": true,
  "message": "Payment processed successfully",
  "transaction_id": 9876
}

Response (Failure):
{
  "status": false,
  "message": "Payment failed",
  "error": "Insufficient funds"
}
```

#### 3. Payment Links

##### Get Payment Link
```
GET /customer/apiv1/payment_link/{hash}

Response:
{
  "status": true,
  "payment_link": {
    "id": 25,
    "name": "Event Registration",
    "description": "Sign up for the conference",
    "payment_methods": "both",
    "products": [
      {
        "id": 10,
        "name": "Conference Ticket",
        "price": "50.00",
        "qty": 100,
        "available": 85
      },
      {
        "id": 11,
        "name": "Workshop Add-on",
        "price": "25.00",
        "qty": null,
        "unlimited": true
      }
    ]
  }
}
```

##### Process Payment Link Purchase
```
POST /customer/apiv1/pay/payment_link
Content-Type: application/json

Request:
{
  "payment_link_hash": "xyz789",
  "products": [
    {"id": 10, "qty": 2},
    {"id": 11, "qty": 1}
  ],
  "source_id": 456,
  "customer": {
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane@example.com",
    "phone": "555-1234"
  }
}

Response:
{
  "status": true,
  "message": "Payment successful",
  "transaction_id": 5432,
  "total_amount": "125.00"
}
```

#### 4. Payment Sources

##### Get Saved Sources
```
GET /customer/apiv1/source/list
Headers: Authorization: Bearer {token}

Response:
{
  "status": true,
  "sources": [
    {
      "id": 123,
      "type": "CC",
      "brand": "Visa",
      "last_four": "4242",
      "exp_month": 12,
      "exp_year": 2025,
      "is_default": true
    },
    {
      "id": 124,
      "type": "ACH",
      "brand": "Bank Account",
      "last_four": "6789",
      "is_default": false
    }
  ]
}
```

##### Add Payment Source
```
POST /customer/apiv1/source/add
Content-Type: application/json

Request (Credit Card):
{
  "type": "CC",
  "token": "tok_visa_4242", // processor token
  "set_default": true
}

Request (ACH):
{
  "type": "ACH",
  "token": "tok_bank_account",
  "set_default": false
}

Response:
{
  "status": true,
  "message": "Payment method added",
  "source_id": 125
}
```

##### Delete Payment Source
```
POST /customer/apiv1/source/delete
Content-Type: application/json

Request:
{
  "source_id": 124
}

Response:
{
  "status": true,
  "message": "Payment method removed"
}
```

#### 5. Subscriptions

##### List Subscriptions
```
GET /customer/apiv1/subscription/list
Headers: Authorization: Bearer {token}

Response:
{
  "status": true,
  "subscriptions": [
    {
      "id": 50,
      "amount": "25.00",
      "frequency": "monthly",
      "status": "active",
      "next_billing_date": "2024-12-15",
      "last_billing_date": "2024-11-15",
      "product": {
        "name": "Monthly Membership"
      }
    }
  ]
}
```

##### Cancel Subscription
```
POST /customer/apiv1/subscription/cancel
Content-Type: application/json

Request:
{
  "subscription_id": 50
}

Response:
{
  "status": true,
  "message": "Subscription cancelled"
}
```

### Widget API

**Base URL**: `/widget/`  
**Authentication**: Access token (custom widget auth system)

#### Setup Widget
```
POST /widget/setup
Headers: 
  Content-Type: application/json
  Access-Token: {widget_access_token}

Request:
{
  "chatgive_tokens": {
    "connection": 1,
    "page": "donation_page"
  }
}

Response:
{
  "status": true,
  "organization": {
    "id": 10,
    "name": "First Church",
    "logo": "https://..."
  },
  "chat_settings": {
    "primary_color": "#007bff",
    "logo_url": "https://..."
  }
}
```

#### Get Widget Settings
```
GET /widget/get_settings?id_bot=35&connection=1

Response:
{
  "status": true,
  "settings": {
    "organization_id": 10,
    "organization_name": "First Church",
    "funds": [
      {"id": 1, "name": "General Fund"},
      {"id": 2, "name": "Building Fund"}
    ],
    "recurring_options": ["one_time", "weekly", "monthly", "yearly"],
    "payment_methods": ["cc", "ach"],
    "branding": {
      "primary_color": "#007bff",
      "logo": "https://..."
    }
  }
}
```

#### Process Donation
```
POST /widget/index
Headers:
  Content-Type: application/json
  Access-Token: {widget_access_token}

Request:
{
  "id_bot": 35,
  "amount": 100.00,
  "fund_id": 1,
  "recurring": "monthly",
  "source_token": "tok_visa_4242",
  "customer": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "555-1234"
  }
}

Response:
{
  "status": true,
  "message": "Donation processed successfully",
  "transaction_id": 12345,
  "receipt_url": "https://..."
}
```

---

## Code Examples

### Creating a New Payment Processor Integration

#### Step 1: Create Payment Gateway Library
**File**: `application/libraries/gateways/MyProcessorLib.php`

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

require_once(APPPATH . 'libraries/gateways/PaymentsProvider.php');

class MyProcessorLib extends PaymentsProvider {
    
    private $api_key;
    private $api_secret;
    private $environment; // 'test' or 'live'
    private $api_base_url;
    
    public function __construct() {
        $this->CI =& get_instance();
        $this->CI->load->config('config');
        
        $this->api_key = $this->CI->config->item('myprocessor_api_key');
        $this->api_secret = $this->CI->config->item('myprocessor_api_secret');
        $this->environment = $this->CI->config->item('myprocessor_environment');
        
        $this->api_base_url = ($this->environment === 'live') 
            ? 'https://api.myprocessor.com/v1/'
            : 'https://sandbox.myprocessor.com/v1/';
    }
    
    /**
     * Process a one-time payment
     */
    public function charge($params) {
        $endpoint = $this->api_base_url . 'charges';
        
        $data = [
            'amount' => $params['amount'] * 100, // convert to cents
            'currency' => 'USD',
            'source' => $params['source_token'],
            'description' => $params['description'],
            'metadata' => [
                'customer_id' => $params['customer_id'],
                'organization_id' => $params['organization_id']
            ]
        ];
        
        $response = $this->apiRequest('POST', $endpoint, $data);
        
        if ($response['status'] === 'success') {
            return [
                'success' => true,
                'transaction_id' => $response['id'],
                'amount' => $response['amount'] / 100,
                'fee' => $response['fee'] / 100,
                'net' => ($response['amount'] - $response['fee']) / 100
            ];
        } else {
            return [
                'success' => false,
                'error' => $response['error_message']
            ];
        }
    }
    
    /**
     * Create a subscription
     */
    public function createSubscription($params) {
        $endpoint = $this->api_base_url . 'subscriptions';
        
        $data = [
            'customer' => $params['customer_id'],
            'amount' => $params['amount'] * 100,
            'interval' => $params['interval'], // 'monthly', 'weekly', etc.
            'source' => $params['source_id']
        ];
        
        $response = $this->apiRequest('POST', $endpoint, $data);
        
        if ($response['status'] === 'active') {
            return [
                'success' => true,
                'subscription_id' => $response['id'],
                'status' => $response['status']
            ];
        } else {
            return [
                'success' => false,
                'error' => $response['error_message']
            ];
        }
    }
    
    /**
     * Cancel a subscription
     */
    public function cancelSubscription($subscription_id) {
        $endpoint = $this->api_base_url . 'subscriptions/' . $subscription_id;
        
        $response = $this->apiRequest('DELETE', $endpoint);
        
        return [
            'success' => $response['status'] === 'cancelled',
            'message' => $response['message']
        ];
    }
    
    /**
     * Process a refund
     */
    public function refund($transaction_id, $amount = null) {
        $endpoint = $this->api_base_url . 'refunds';
        
        $data = [
            'charge' => $transaction_id
        ];
        
        if ($amount) {
            $data['amount'] = $amount * 100;
        }
        
        $response = $this->apiRequest('POST', $endpoint, $data);
        
        return [
            'success' => $response['status'] === 'succeeded',
            'refund_id' => $response['id']
        ];
    }
    
    /**
     * Make API request
     */
    private function apiRequest($method, $url, $data = null) {
        $ch = curl_init();
        
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        
        $headers = [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $this->api_key
        ];
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        
        if ($data && in_array($method, ['POST', 'PUT', 'PATCH'])) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
        
        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        return json_decode($response, true);
    }
}
```

#### Step 2: Create Onboarding Model
**File**: `application/models/Orgnx_onboard_myprocessor_model.php`

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Orgnx_onboard_myprocessor_model extends CI_Model {
    
    private $table = 'church_onboard_myprocessor';
    
    public function __construct() {
        parent::__construct();
    }
    
    /**
     * Check if organization onboarding is complete
     */
    public function checkOrganizationIsCompleted($user_id, $with_chat = false) {
        $this->db->select('cob.*, ch.ch_id, ch.church_name');
        $this->db->from($this->table . ' cob');
        $this->db->join('church ch', 'cob.church_id = ch.ch_id');
        $this->db->where('cob.user_id', $user_id);
        $this->db->where('cob.merchant_account_active', 1);
        
        if ($with_chat) {
            $this->db->join('chat_settings cs', 'cs.church_id = ch.ch_id');
            $this->db->where('cs.client_id', $user_id);
        }
        
        $query = $this->db->get();
        return $query->num_rows() > 0;
    }
    
    /**
     * Create onboarding record
     */
    public function register($data) {
        $insert_data = [
            'user_id' => $data['user_id'],
            'church_id' => $data['church_id'],
            'merchant_id' => $data['merchant_id'],
            'status' => 'pending',
            'created_at' => date('Y-m-d H:i:s')
        ];
        
        $this->db->insert($this->table, $insert_data);
        return $this->db->insert_id();
    }
    
    /**
     * Update onboarding status
     */
    public function updateStatus($id, $status) {
        $this->db->where('id', $id);
        return $this->db->update($this->table, [
            'status' => $status,
            'updated_at' => date('Y-m-d H:i:s')
        ]);
    }
    
    /**
     * Activate merchant account
     */
    public function activateMerchant($church_id) {
        $this->db->where('church_id', $church_id);
        return $this->db->update($this->table, [
            'merchant_account_active' => 1,
            'activated_at' => date('Y-m-d H:i:s')
        ]);
    }
}
```

#### Step 3: Create Webhook Handler
**File**: `application/controllers/Myprocessorwebhooks.php`

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Myprocessorwebhooks extends CI_Controller {
    
    public function __construct() {
        parent::__construct();
        $this->load->model('donation_model');
        $this->load->library('gateways/MyProcessorLib');
    }
    
    /**
     * Webhook endpoint
     */
    public function index() {
        // Get raw POST data
        $payload = file_get_contents('php://input');
        $event = json_decode($payload, true);
        
        // Verify webhook signature (security)
        if (!$this->verifySignature($payload)) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid signature']);
            return;
        }
        
        // Log webhook
        $this->logWebhook($event);
        
        // Process event
        switch ($event['type']) {
            case 'charge.succeeded':
                $this->handleChargeSucceeded($event['data']);
                break;
                
            case 'charge.failed':
                $this->handleChargeFailed($event['data']);
                break;
                
            case 'subscription.created':
                $this->handleSubscriptionCreated($event['data']);
                break;
                
            case 'subscription.cancelled':
                $this->handleSubscriptionCancelled($event['data']);
                break;
                
            default:
                // Unhandled event type
                break;
        }
        
        // Return 200 OK
        http_response_code(200);
        echo json_encode(['received' => true]);
    }
    
    /**
     * Verify webhook signature
     */
    private function verifySignature($payload) {
        $signature = $_SERVER['HTTP_X_MYPROCESSOR_SIGNATURE'] ?? '';
        $secret = $this->config->item('myprocessor_webhook_secret');
        
        $expected = hash_hmac('sha256', $payload, $secret);
        return hash_equals($expected, $signature);
    }
    
    /**
     * Handle successful charge
     */
    private function handleChargeSucceeded($data) {
        $charge = $data['object'];
        
        // Find existing transaction by processor ID
        $transaction = $this->donation_model->getByProcessorId($charge['id']);
        
        if ($transaction) {
            // Update transaction status
            $this->donation_model->update([
                'status' => 'P',
                'trx_type' => 'Donation',
                'transaction_detail' => json_encode($charge)
            ], $transaction->id);
        }
    }
    
    /**
     * Handle failed charge
     */
    private function handleChargeFailed($data) {
        $charge = $data['object'];
        
        $transaction = $this->donation_model->getByProcessorId($charge['id']);
        
        if ($transaction) {
            $this->donation_model->update([
                'status' => 'F',
                'manual_failed' => 1,
                'transaction_detail' => json_encode($charge)
            ], $transaction->id);
        }
    }
    
    /**
     * Log webhook to database
     */
    private function logWebhook($event) {
        $this->db->insert('myprocessor_webhooks', [
            'event_type' => $event['type'],
            'payload' => json_encode($event),
            'processed' => 0,
            'received_at' => date('Y-m-d H:i:s')
        ]);
    }
}
```

### Creating a Custom Helper

**File**: `application/helpers/myhelper_helper.php`

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * Format currency
 */
if (!function_exists('format_currency')) {
    function format_currency($amount, $currency = 'USD') {
        $symbol = $currency === 'USD' ? '$' : $currency;
        return $symbol . number_format($amount, 2);
    }
}

/**
 * Calculate fee
 */
if (!function_exists('calculate_fee')) {
    function calculate_fee($amount, $percentage, $fixed) {
        return ($amount * $percentage) + $fixed;
    }
}

/**
 * Get organization by token
 */
if (!function_exists('get_organization_by_token')) {
    function get_organization_by_token($token) {
        $CI =& get_instance();
        $CI->load->model('organization_model');
        return $CI->organization_model->getByToken($token);
    }
}

/**
 * Generate secure hash
 */
if (!function_exists('generate_secure_hash')) {
    function generate_secure_hash($length = 32) {
        return bin2hex(random_bytes($length / 2));
    }
}

/**
 * Send notification email
 */
if (!function_exists('send_notification_email')) {
    function send_notification_email($to, $subject, $message) {
        $CI =& get_instance();
        require_once(APPPATH . 'libraries/email/EmailProvider.php');
        EmailProvider::init();
        
        return EmailProvider::send([
            'to' => $to,
            'subject' => $subject,
            'message' => $message,
            'from' => EMAIL_FROM_TITLE_FOR_NOTIFICACTIONS
        ]);
    }
}
```

---

## Helper Functions

### Main Helper (`main_helper.php`)

```php
// Output JSON response
function output_json($data, $encode = false) {
    header('Content-Type: application/json');
    echo $encode ? json_encode($data) : $data;
    exit;
}

// Get language translation
function langx($key) {
    $CI =& get_instance();
    $CI->lang->load('main');
    return $CI->lang->line($key) ?: $key;
}

// Format errors for display
function stringifyFormatErrors($errors) {
    if (is_array($errors)) {
        return implode('<br>', $errors);
    }
    return $errors;
}

// Check if user is logged in
function is_logged_in() {
    $CI =& get_instance();
    return $CI->ion_auth->logged_in();
}

// Get current user ID
function get_user_id() {
    $CI =& get_instance();
    return $CI->session->userdata('user_id');
}
```

### Payment Links Helper (`payment_links_helper.php`)

```php
// Calculate payment link total
function calculate_payment_link_total($products) {
    $total = 0;
    foreach ($products as $product) {
        $total += $product['price'] * $product['qty'];
    }
    return $total;
}

// Check product availability
function check_product_availability($payment_link_product_id, $requested_qty) {
    $CI =& get_instance();
    $CI->load->model('payment_link_product_model');
    
    $product = $CI->payment_link_product_model->get($payment_link_product_id);
    
    if ($product->unlimited_qty) {
        return true;
    }
    
    $sold = $CI->payment_link_product_model->getSoldQuantity($payment_link_product_id);
    $available = $product->qty - $sold;
    
    return $available >= $requested_qty;
}
```

### Verification Code Helper (`verification_code_helper.php`)

```php
// Generate verification code
function generate_verification_code($length = 6) {
    return str_pad(rand(0, pow(10, $length) - 1), $length, '0', STR_PAD_LEFT);
}

// Send SMS verification code
function send_sms_verification($phone, $code) {
    $CI =& get_instance();
    require_once(APPPATH . 'libraries/messenger/Twilio.php');
    
    $twilio = new Twilio();
    $message = "Your verification code is: {$code}";
    
    return $twilio->sendSMS($phone, $message);
}
```

---

## Payment Gateway Implementation

### Abstract PaymentsProvider Interface

All payment gateways should extend this:

```php
abstract class PaymentsProvider {
    
    // Process one-time payment
    abstract public function charge($params);
    
    // Create subscription
    abstract public function createSubscription($params);
    
    // Cancel subscription
    abstract public function cancelSubscription($subscription_id);
    
    // Process refund
    abstract public function refund($transaction_id, $amount = null);
    
    // Create customer
    public function createCustomer($params) {
        // Optional: Override in child class
    }
    
    // Get customer
    public function getCustomer($customer_id) {
        // Optional: Override in child class
    }
    
    // Save payment source
    public function savePaymentSource($params) {
        // Optional: Override in child class
    }
}
```

### Example Implementation Flow

```php
// In controller
public function process_payment() {
    $user_id = $this->session->userdata('user_id');
    $user = $this->user_model->get($user_id);
    
    // Load appropriate gateway based on user's payment processor
    switch ($user->payment_processor) {
        case PROVIDER_PAYMENT_FORTIS_SHORT:
            $this->load->library('gateways/FortisLib');
            $gateway = $this->fortislib;
            break;
            
        case PROVIDER_PAYMENT_PAYSAFE_SHORT:
            $this->load->library('gateways/PaySafeLib');
            $gateway = $this->paysafelib;
            break;
            
        case PROVIDER_PAYMENT_EPICPAY_SHORT:
            $this->load->library('gateways/PtyEpicPay');
            $gateway = $this->ptyepicpay;
            break;
            
        default:
            output_json(['status' => false, 'message' => 'Invalid payment processor']);
            return;
    }
    
    // Prepare payment params
    $params = [
        'amount' => $this->input->post('amount'),
        'source_token' => $this->input->post('source_token'),
        'customer_id' => $this->input->post('donor_id'),
        'organization_id' => $this->session->userdata('currnt_org')['orgnx_id'],
        'description' => 'Donation'
    ];
    
    // Process payment
    $result = $gateway->charge($params);
    
    if ($result['success']) {
        // Save transaction
        $this->load->model('donation_model');
        $transaction_id = $this->donation_model->register([
            'user_id' => $user_id,
            'donor_id' => $params['customer_id'],
            'church_id' => $params['organization_id'],
            'amount' => $result['amount'],
            'fee' => $result['fee'],
            'net' => $result['net'],
            'status' => 'P',
            'src' => 'CC',
            'trx_type' => 'Donation',
            'transaction_detail' => json_encode($result),
            'date' => date('Y-m-d H:i:s')
        ]);
        
        output_json([
            'status' => true,
            'message' => 'Payment successful',
            'transaction_id' => $transaction_id
        ]);
    } else {
        output_json([
            'status' => false,
            'message' => 'Payment failed: ' . $result['error']
        ]);
    }
}
```

---

## Webhook Handling

### Best Practices

1. **Always verify webhook signatures**
2. **Log all incoming webhooks**
3. **Process webhooks asynchronously** (use queue for production)
4. **Return 200 OK quickly** to prevent retries
5. **Handle idempotency** (same webhook received multiple times)

### Example Webhook Table Structure

```sql
CREATE TABLE webhooks_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  provider VARCHAR(20),
  event_type VARCHAR(100),
  event_id VARCHAR(255) UNIQUE,
  payload TEXT,
  signature VARCHAR(500),
  processed TINYINT(1) DEFAULT 0,
  processed_at DATETIME,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  received_at DATETIME,
  INDEX idx_processed (processed),
  INDEX idx_provider (provider),
  INDEX idx_event_id (event_id)
);
```

### Webhook Processing Pattern

```php
public function processWebhook($webhook_id) {
    $webhook = $this->db->get_where('webhooks_log', ['id' => $webhook_id])->row();
    
    if (!$webhook || $webhook->processed) {
        return; // Already processed
    }
    
    try {
        $event = json_decode($webhook->payload, true);
        
        // Process based on event type
        switch ($event['type']) {
            case 'payment.succeeded':
                $this->handlePaymentSucceeded($event['data']);
                break;
            // ... other events
        }
        
        // Mark as processed
        $this->db->where('id', $webhook_id);
        $this->db->update('webhooks_log', [
            'processed' => 1,
            'processed_at' => date('Y-m-d H:i:s')
        ]);
        
    } catch (Exception $e) {
        // Log error
        $this->db->where('id', $webhook_id);
        $this->db->update('webhooks_log', [
            'error_message' => $e->getMessage(),
            'retry_count' => $webhook->retry_count + 1
        ]);
    }
}
```

---

## Widget Integration Guide

### Basic Widget Embed

```html
<!DOCTYPE html>
<html>
<head>
    <title>Donate</title>
</head>
<body>
    <h1>Support Our Cause</h1>
    
    <!-- Widget Container -->
    <div id="lunarpay-widget"></div>
    
    <!-- Widget Script -->
    <script src="https://app.lunarpay.com/assets/widget/widget.js"></script>
    <script>
        LunarPayWidget.init({
            container: '#lunarpay-widget',
            organizationToken: 'org_abc123def456',
            primaryColor: '#007bff',
            defaultAmount: 50,
            showRecurring: true,
            funds: [1, 2, 3], // Fund IDs to display
            onSuccess: function(transaction) {
                console.log('Donation successful!', transaction);
                alert('Thank you for your donation!');
            },
            onError: function(error) {
                console.error('Donation failed', error);
                alert('Payment failed. Please try again.');
            }
        });
    </script>
</body>
</html>
```

### Standalone Widget Page

```
https://app.lunarpay.com/{organization_slug}
```

Example:
```
https://app.lunarpay.com/first-church
https://app.lunarpay.com/downtown-campus
```

### Widget API Authentication

```javascript
// Widget obtains access token on initialization
fetch('https://app.lunarpay.com/widget/setup', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Access-Token': widget_access_token
    },
    body: JSON.stringify({
        chatgive_tokens: {
            connection: 1,
            page: 'donation'
        }
    })
})
.then(response => response.json())
.then(data => {
    // Store organization settings
    console.log(data.organization);
});
```

---

## Testing Guidelines

### Unit Testing

Create tests in `application/tests/` (if using PHPUnit):

```php
<?php
class DonationModelTest extends TestCase {
    
    public function setUp() {
        $this->resetInstance();
        $this->CI->load->model('donation_model');
    }
    
    public function testCreateDonation() {
        $data = [
            'user_id' => 1,
            'donor_id' => 10,
            'church_id' => 5,
            'amount' => 100.00,
            'status' => 'P'
        ];
        
        $donation_id = $this->CI->donation_model->register($data);
        
        $this->assertGreaterThan(0, $donation_id);
        
        $donation = $this->CI->donation_model->get($donation_id);
        $this->assertEquals(100.00, $donation->amount);
    }
    
    public function testGetDonationsByDonor() {
        $donations = $this->CI->donation_model->getByDonor(10);
        
        $this->assertIsArray($donations);
        $this->assertGreaterThan(0, count($donations));
    }
}
```

### Integration Testing

Test complete flows:

```php
public function testCompletePaymentFlow() {
    // 1. Create donor
    $donor_id = $this->createTestDonor();
    
    // 2. Process payment
    $result = $this->processTestPayment($donor_id, 50.00);
    $this->assertTrue($result['success']);
    
    // 3. Verify transaction created
    $transaction = $this->CI->donation_model->get($result['transaction_id']);
    $this->assertEquals(50.00, $transaction->amount);
    $this->assertEquals('P', $transaction->status);
    
    // 4. Verify donor updated
    $donor = $this->CI->donor_model->get($donor_id);
    $this->assertGreaterThan(0, $donor->total_donations);
}
```

### API Testing with cURL

```bash
# Test invoice API
curl -X GET \
  "https://app.lunarpay.com/customer/apiv1/invoice/abc123" \
  -H "Content-Type: application/json"

# Test payment
curl -X POST \
  "https://app.lunarpay.com/customer/apiv1/pay/invoice" \
  -H "Content-Type: application/json" \
  -d '{
    "invoice_hash": "abc123",
    "source_id": 456,
    "amount": 150.00
  }'
```

### Database Testing

Always test migrations before deploying:

```bash
# Create test database
mysql -u root -p -e "CREATE DATABASE lunarpay_test;"

# Run migrations
php index.php utilities/migrate/run

# Verify tables created
mysql -u root -p lunarpay_test -e "SHOW TABLES;"

# Test rollback capability (if implemented)
php index.php utilities/migrate/rollback
```

---

## Performance Optimization

### Database Indexing

Ensure proper indexes on:
- Foreign keys
- Frequently queried fields
- Date/timestamp fields for reporting
- Status fields for filtering

```sql
-- Example indexes
CREATE INDEX idx_donor_email ON account_donor(email);
CREATE INDEX idx_transaction_date ON transactions_funds(date);
CREATE INDEX idx_transaction_status ON transactions_funds(status);
CREATE INDEX idx_transaction_donor ON transactions_funds(donor_id, date);
```

### Caching

Use CodeIgniter's caching:

```php
// Cache organization data
$this->load->driver('cache', ['adapter' => 'memcached']);

$organization_id = 10;
$cache_key = 'organization_' . $organization_id;

if (!$organization = $this->cache->get($cache_key)) {
    $organization = $this->organization_model->get($organization_id);
    $this->cache->save($cache_key, $organization, 3600); // Cache for 1 hour
}
```

### Query Optimization

```php
// Bad - N+1 query problem
$donations = $this->donation_model->getList();
foreach ($donations as $donation) {
    $donation->donor = $this->donor_model->get($donation->donor_id);
}

// Good - Join query
$this->db->select('t.*, d.first_name, d.last_name, d.email');
$this->db->from('transactions_funds t');
$this->db->join('account_donor d', 't.donor_id = d.id');
$donations = $this->db->get()->result();
```

---

**Document Version**: 1.0  
**Last Updated**: November 2024  
**Status**: Technical Reference Complete

