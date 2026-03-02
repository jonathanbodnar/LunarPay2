# Fortis API Integration - Complete Endpoint Documentation

## Table of Contents
1. [Overview](#overview)
2. [API Configuration](#api-configuration)
3. [Endpoints Used](#endpoints-used)
4. [Code Locations](#code-locations)
5. [Data Flow](#data-flow)
6. [Webhook System](#webhook-system)
7. [Error Handling](#error-handling)

---

## Overview

LunarPay integrates with Fortis (formerly NMI/PaymentCloud) payment processing platform for credit card and ACH transactions. Fortis is the default payment processor (`PROVIDER_PAYMENT_FORTIS` = 4).

**Integration Type**: REST API  
**Authentication**: Developer ID + User ID + User API Key (Header-based)  
**Supported Payment Methods**: Credit Card (CC), ACH/Bank Account (BNK)

---

## API Configuration

### Base URLs

```php
// Production
const URL = 'https://api.fortis.tech/v1/';

// Sandbox/Test
const URL_TEST = 'https://api.sandbox.fortis.tech/v1/';
```

**File Location**: `application/libraries/gateways/FortisLib.php` (lines 20-21)

### Environment Selection

**Configuration File**: `application/config/config.php`

```php
$config['fortis_environment'] = $_ENV['fortis_environment']; // 'dev' or 'prd'
```

**Code Location**: `FortisLib.php` constructor (lines 239-248)

```php
$this->environment = $this->CI->config->item('fortis_environment');

if ($this->environment === null || $this->environment === 'dev') {
    $this->setTesting(true);  // Uses sandbox
} else if ($this->environment === 'prd') {
    $this->setTesting(false);  // Uses production
}
```

### Authentication Credentials

#### Sandbox Credentials
```php
$config['fortis_developer_id_sandbox']    = $_ENV['fortis_developer_id_sandbox'];
$config['fortis_user_id_sandbox']         = $_ENV['fortis_user_id_sandbox'];
$config['fortis_user_api_key_sandbox']    = $_ENV['fortis_user_api_key_sandbox'];
$config['fortis_location_id_sandbox']     = $_ENV['fortis_location_id_sandbox'];
```

#### Production Credentials
```php
$config['fortis_developer_id_production'] = $_ENV['fortis_developer_id_production'];
$config['fortis_user_id_production']      = $_ENV['fortis_user_id_production'];
$config['fortis_user_api_key_production'] = $_ENV['fortis_user_api_key_production'];
```

**Code Location**: `FortisLib.php::setTesting()` method (lines 464-483)

### HTTP Headers
All API requests include these headers:

```php
'Accept: application/json'
'Content-Type: application/json'
'developer-id: {developerId}'
'user-id: {userId}'
'user-api-key: {userApiKey}'
```

**Code Location**: `FortisLib.php::_makeCurlRequest()` (lines 353-359)

---

## Endpoints Used

### 1. Merchant Onboarding

#### Endpoint
```
POST /v1/onboarding
```

#### Purpose
Creates a new merchant account in Fortis system for an organization.

#### Request Body
```json
{
  "primary_principal": {
    "first_name": "John",
    "last_name": "Doe",
    "phone_number": "555-555-1212"
  },
  "email": "merchant@example.com",
  "dba_name": "First Church",
  "template_code": "ActiveBase4",
  "website": "https://firstchurch.org",
  "location": {
    "address_line_1": "123 Main St",
    "state_province": "TX",
    "city": "Dallas",
    "postal_code": "75001",
    "phone_number": "555-555-1212"
  },
  "app_delivery": "link_iframe",
  "bank_account": {
    "routing_number": "011000015",
    "account_number": "1234567890",
    "account_holder_name": "John Doe"
  },
  "alt_bank_account": {
    "routing_number": "011000015",
    "account_number": "0987654321",
    "account_holder_name": "John Doe"
  },
  "legal_name": "First Church Inc",
  "contact": {
    "phone_number": "555-555-1212"
  },
  "client_app_id": "123"
}
```

#### Response (Success)
```json
{
  "type": "Onboarding",
  "data": {
    "primary_principal": {
      "first_name": "John"
    },
    "template_code": "ActiveBase4",
    "email": "merchant@example.com",
    "dba_name": "First Church",
    "client_app_id": "123",
    "app_link": "https://mpa.paymentportal.cc/xframe/clearapp/start/ABC123"
  }
}
```

#### Response (Error)
```json
{
  "type": "Error",
  "detail": "Error message description"
}
```

#### Code Locations

**Library Method**: `FortisLib.php::onboardMerchant()` (lines 267-314)

```php
public function onboardMerchant($requestBody)
{
    $resp = $this->_makeCurlRequest('onboarding', $requestBody);
    
    if (isset($resp['response']->type) && $resp['response']->type == "Error") {
        return ['status' => false, 'result' => $resp['response'], 
                'message' => $resp['response']->detail];
    } else {
        return ['status' => true, 'result' => $resp['response']];
    }
}
```

**Called From**: `Getting_started_fts.php::doProcessorOnboarding()` (lines 491-563)

```php
private function doProcessorOnboarding($orgnx_id, $bank_accounts)
{
    $merchantData = [/* ... merchant data ... */];
    $response = $this->PaymentInstance->onboardMerchant($merchantData);
    
    if ($response['status'] === true) {
        $save_data['app_status'] = 'BANK_INFORMATION_SENT';
        $save_data['mpa_link'] = $response['result']->data->app_link;
        $this->orgnx_onboard_fts_model->update($save_data, $user_id);
    }
}
```

**User Flow**:
1. User fills out Getting Started wizard (Step 2)
2. Submits bank account information
3. System calls `save_onboarding()` endpoint
4. `doProcessorOnboarding()` is triggered
5. Fortis onboarding API is called
6. Merchant receives email with app link for completion
7. Database updated with `app_status` and `mpa_link`

**Database Table**: `church_onboard_fortis`

---

### 2. Transaction Intention (Elements)

#### Endpoint
```
POST /v1/elements/transaction/intention
```

#### Purpose
Creates a client token for Fortis Elements (embedded payment form). This token is used client-side to collect payment information securely without touching the server.

#### Request Body
```json
{
  "location_id": "11e95f8ec39de8fbdb0a4f1a",
  "contact_id": "11e95f8ec39de8fbdb0a4f1a",
  "product_transaction_id": "11e95f8ec39de8fbdb0a4f1a",
  "action": "sale",
  "amount": 10000
}
```

**Fields**:
- `location_id` (required) - Merchant location ID from onboarding
- `contact_id` (optional) - Customer contact ID if exists
- `product_transaction_id` (optional) - Product transaction config ID
- `action` (required) - Transaction action: "sale", "avsonly", "authonly"
- `amount` (required for sale) - Amount in cents (integer)

#### Response (Success)
```json
{
  "data": {
    "client_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Response (Error)
```json
{
  "detail": "Error description message"
}
```

#### Code Locations

**Library Method**: `FortisLib.php::createTransactionIntention()` (lines 316-340)

```php
public function createTransactionIntention($data)
{
    if($data['action'] === 'sale') {
        if (!isset($data['amount']) || !is_int($data['amount'])) {
            return ['status' => false, 'message' => 'Amount is required must be an integer'];
        }
    }
    
    $resp = $this->_makeCurlRequest('elements/transaction/intention', $data);
    
    if (isset($resp['response']->data->client_token)) {
        return ['status' => true, 
                'result' => ['client_token' => $resp['response']->data->client_token]];
    } else {
        return ['status' => false, 
                'message' => $resp['response']->detail ?? 'An error occurred creating the transaction intention'];
    }
}
```

**Usage Context**: This endpoint is typically called from frontend JavaScript when initializing Fortis Elements payment forms. The client token is passed to Fortis.js library for secure payment collection.

**Frontend Integration** (typical usage):
```javascript
// Get client token from server
fetch('/api/get-transaction-intention', {
    method: 'POST',
    body: JSON.stringify({ amount: 10000, action: 'sale' })
})
.then(res => res.json())
.then(data => {
    // Initialize Fortis Elements with token
    FortisElements.init({
        clientToken: data.client_token,
        onSuccess: function(payment) {
            // Process payment response
        }
    });
});
```

---

### 3. Credit Card Sale with Token

#### Endpoint
```
POST /v1/transactions/cc/sale/token
```

#### Purpose
Process a credit card payment using a saved payment token (wallet).

#### Request Body
```json
{
  "transaction_amount": 5000,
  "token_id": "11e95f8ec39de8fbdb0a4f1a",
  "client_customer_id": "123",
  "transaction_c1": "L-4567-20241129153045",
  "transaction_c2": "4567"
}
```

**Fields**:
- `transaction_amount` (required) - Amount in cents (integer)
- `token_id` (required) - Saved payment token/wallet ID
- `client_customer_id` (optional) - Internal customer ID
- `transaction_c1` (optional) - Custom field 1 (we use: SYSTEM_LETTER_ID-TRANSACTION_ID-TIMESTAMP)
- `transaction_c2` (optional) - Custom field 2 (we use: TRANSACTION_ID)

#### Response (Success)
```json
{
  "data": {
    "id": "11e95f8ec39de8fbdb0a4f1a",
    "status_code": 101,
    "reason_code_id": 1000,
    "transaction_amount": 5000,
    "auth_amount": 5000,
    "transaction_batch_id": "...",
    "created_ts": 1234567890
  }
}
```

#### Response (Failure)
```json
{
  "data": {
    "id": "11e95f8ec39de8fbdb0a4f1a",
    "status_code": 301,
    "reason_code_id": 1500,
    "reason_code": "Generic Decline"
  }
}
```

#### Code Locations

**Library Method**: `FortisLib.php::createTransaction()` (lines 514-705)

```php
public function createTransaction($transactionData, $customerData, $paymentData, 
                                   $fund_data, $productsWithRequest = null, 
                                   $isAnonymous = false)
{
    $requestBody = [];
    $requestBody['transaction_amount'] = $paymentData['amount'];
    
    $endPoint = null;
    if ($paymentData['method'] == 'wallet') { 
        if ($transactionData["src"] == "CC") {
            $requestBody['token_id'] = $paymentData['wallet']['wallet_id'];
            $endPoint = 'transactions/cc/sale/token';  // THIS ENDPOINT
        }
    }
    
    // Insert transaction to database first
    $this->CI->db->insert(self::TABLE_CUSTOMER_TRX, $transactionData);
    $trxId = $this->CI->db->insert_id();
    
    // Add custom fields
    $requestBody['transaction_c1'] = $this->SYSTEM_LETTER_ID . '-' . $trxId . 
                                      '-' . date('YmdHis', strtotime($transactionData['created_at']));
    $requestBody['transaction_c2'] = "$trxId";
    
    // Make API call
    $response = $this->_makeCurlRequest($endPoint, $requestBody, 'post');
    
    // Process response
    if ($response['error'] == 1 || !isset($response['response']->data->id) || 
        $response['response']->data->status_code == 301) {
        // Handle failure
        $_reason_code = $response['response']->data->reason_code_id ?? FALSE;
        // Update transaction as failed
    } else {
        // Handle success
        // Update transaction as successful
        // Create PDF receipt
    }
    
    return $response;
}
```

**Called From**:
1. `extensions/Payments.php::process()` - Main payment processing
2. Widget transactions
3. Invoice payments
4. Payment link purchases
5. Text-to-give donations
6. Subscription initial payments

**Reason Codes**: See `FortisLib::REASON_CODES` constant (lines 23-215) for complete list of 100+ reason codes.

---

### 4. ACH Debit with Token

#### Endpoint
```
POST /v1/transactions/ach/debit/token
```

#### Purpose
Process an ACH/bank account payment using a saved payment token.

#### Request Body
```json
{
  "transaction_amount": 5000,
  "token_id": "11e95f8ec39de8fbdb0a4f1a",
  "client_customer_id": "123",
  "transaction_c1": "L-4567-20241129153045",
  "transaction_c2": "4567"
}
```

**Fields**: Same as credit card endpoint

#### Response
Same structure as credit card endpoint

#### Code Locations

**Library Method**: `FortisLib.php::createTransaction()` (lines 514-705)

```php
if ($paymentData['method'] == 'wallet') { 
    if ($transactionData["src"] == "CC") {
        $requestBody['token_id'] = $paymentData['wallet']['wallet_id'];
        $endPoint = 'transactions/cc/sale/token';
    } elseif ($transactionData["src"] == "BNK") {
        $requestBody['token_id'] = $paymentData['wallet']['wallet_id'];
        $endPoint = 'transactions/ach/debit/token';  // THIS ENDPOINT
    }
}
```

**Transaction Flow**:
1. User selects bank account payment method
2. Transaction created in database with `src='BNK'`
3. API call made to ACH endpoint
4. Response processed
5. If successful, status set to 'P' with `status_ach='W'` (Waiting)
6. ACH transactions take 1-3 business days to clear
7. Webhook updates final status when cleared/returned

**ACH Status Codes**:
- `W` - Waiting (pending clearance)
- `P` - Processed (cleared successfully)
- `F` - Failed/Returned

---

### 5. Refund Transaction

#### Endpoint
```
PATCH /v1/transactions/{transaction_id}/refund
```

#### Purpose
Refund a previously processed transaction (full or partial).

#### URL Parameters
- `{transaction_id}` - Fortis transaction ID from original transaction

#### Request Body
```json
{
  "transaction_amount": 5000
}
```

**Fields**:
- `transaction_amount` (required) - Amount to refund in cents (integer)

#### Response (Success)
```json
{
  "data": {
    "id": "11e95f8ec39de8fbdb0a4f1a",
    "status_code": 111,
    "transaction_amount": -5000,
    "type_id": "refund"
  }
}
```

#### Response (Error)
```json
{
  "type": "Error",
  "detail": "Transaction cannot be refunded"
}
```

#### Code Locations

**Library Method**: `FortisLib.php::refundTransaction()` (lines 1071-1184)

```php
public function refundTransaction($trxId)
{
    $transaction = $this->CI->db->where('id', $trxId)
                                 ->get(self::TABLE_CUSTOMER_TRX)->row();
    
    if (!$transaction || $transaction->epicpay_transaction_id == null) {
        return ['error' => 1, 
                'message' => 'The current transaction cannot be refunded'];
    }
    
    if ($transaction->status == 'R') {
        return ['error' => 1, 'message' => 'Transaction already refunded'];
    }
    
    // Create refund transaction record
    $refundData = [
        // ... negative amount transaction ...
        'trx_type' => 'RE',
        'status' => 'N',
    ];
    
    // Get merchant credentials
    $church_onboard = $this->CI->db->where('church_id', $transaction->church_id)
                                    ->get('church_onboard_fortis')->row();
    
    if (!$this->getTesting()) {
        $this->userId = $church_onboard->auth_user_id;
        $this->userApiKey = $church_onboard->auth_user_api_key;
    }
    
    // Call refund endpoint
    if ($transaction->src == "CC") {
        $requestBody = [
            'transaction_amount' => (int)((string)($transaction->total_amount * 100)),
        ];
        $response = $this->_makeCurlRequest(
            'transactions/' . $transaction->epicpay_transaction_id . '/refund', 
            $requestBody, 
            'patch'
        );
    } elseif ($transaction->src == "BNK") {
        $requestBody = [
            'transaction_amount' => (int)((string)($transaction->total_amount * 100)),
        ];
        $response = $this->_makeCurlRequest(
            'transactions/' . $transaction->epicpay_transaction_id . '/refund', 
            $requestBody, 
            'patch'
        );
    }
    
    // Process response and update records
    if ($response['error'] == 0 && !isset($response['response']->type)) {
        $refundData['status'] = 'P';
        // Update donor totals
        // Create fund records
    }
    
    return $response;
}
```

**Called From**:
1. `Donations.php::refund()` - Manual refund from admin dashboard
2. Customer service refund requests

**Database Impact**:
1. Creates new transaction record with negative amount
2. Updates original transaction with `trx_ret_id` (refund transaction ID)
3. Updates donor accumulated totals (subtracts refunded amount)
4. Creates negative fund allocation records

---

## Code Locations

### Main Library File
**Path**: `application/libraries/gateways/FortisLib.php`

**Key Methods**:
- `__construct()` - Initialize library, set environment (lines 230-264)
- `setTesting($value)` - Switch between sandbox/production (lines 464-483)
- `onboardMerchant($requestBody)` - Merchant onboarding (lines 267-314)
- `createTransactionIntention($data)` - Elements token generation (lines 316-340)
- `createTransaction(...)` - Process payments (lines 514-705)
- `createSubscription(...)` - Create recurring payments (lines 719-855)
- `refundTransaction($trxId)` - Process refunds (lines 1071-1184)
- `createCustomer(...)` - Save customer & payment source (lines 858-954)
- `deleteCustomerSource(...)` - Delete saved payment method (lines 967-1014)
- `stopCustomerSubscription(...)` - Cancel subscription (lines 1026-1059)
- `_makeCurlRequest(...)` - Generic API request handler (lines 342-443)

### Controller Files

#### Getting Started / Onboarding
**Path**: `application/controllers/Getting_started_fts.php`

**Key Methods**:
- `save_onboarding()` - Step-by-step onboarding wizard (lines 110-427)
- `doProcessorOnboarding()` - Trigger Fortis merchant creation (lines 491-563)
- `getOnboardingStatus()` - Check merchant application status (lines 472-489)

#### Cron Job Processor
**Path**: `application/controllers/Fortiscron.php`

**Key Methods**:
- `process_recurrent_transactions()` - Process daily subscription payments (lines 13-214)

#### Webhook Receiver
**Path**: `application/controllers/Fortiswebhooks.php`

**Key Methods**:
- `merchant_account_status_listener()` - Receive merchant approval webhooks (lines 54-123)
- `fortis_account_belongs_to_me()` - Check if account belongs to this system (lines 28-33)
- `seekFortisAccountAmongSystems()` - Multi-system routing (lines 35-52)

### Model Files

**Path**: `application/models/Orgnx_onboard_fts_model.php`

**Key Methods**:
- `getByOrg()` - Get onboarding record by organization
- `update()` - Update onboarding details
- `checkOrganizationIsCompleted()` - Verify merchant is ready

---

## Data Flow

### 1. Merchant Onboarding Flow

```
User Dashboard (Getting Started)
    ↓
Getting_started_fts.php::save_onboarding() [Step 2]
    ↓
Getting_started_fts.php::doProcessorOnboarding()
    ↓
FortisLib.php::onboardMerchant()
    ↓
POST /v1/onboarding
    ↓
Fortis API Response (includes app_link)
    ↓
Save to church_onboard_fortis table
    ├── app_status = 'BANK_INFORMATION_SENT'
    ├── mpa_link = 'https://mpa.paymentportal.cc/...'
    └── processor_response = JSON
    ↓
Email sent to merchant with app_link
    ↓
Merchant completes application in Fortis MPA
    ↓
Fortis sends webhook to /fortiswebhooks/merchant_account_status_listener
    ↓
Webhook updates:
    ├── auth_user_id (merchant's user ID)
    ├── auth_user_api_key (merchant's API key)
    └── app_status = 'ACTIVE'
    ↓
Email sent: "Your account is ready for receiving payments!"
```

### 2. Payment Processing Flow

```
Customer initiates payment (Widget/Invoice/Payment Link)
    ↓
Frontend collects payment info (Fortis Elements OR saved wallet)
    ↓
extensions/Payments.php::process()
    ↓
FortisLib.php::createTransaction()
    ↓
Create transaction record in DB (status='N', pending)
    ↓
Determine endpoint:
    ├── CC with token → POST /v1/transactions/cc/sale/token
    └── ACH with token → POST /v1/transactions/ach/debit/token
    ↓
Send request to Fortis API
    ↓
Fortis processes payment
    ↓
Response received
    ↓
Success (status_code=101, reason_code=1000)?
    ├── YES:
    │   ├── Update transaction: status='P'
    │   ├── Update donor totals
    │   ├── Generate PDF receipt
    │   ├── Send confirmation email
    │   └── Return success to frontend
    └── NO:
        ├── Update transaction: status='N'
        ├── Log failure reason
        └── Return error to frontend
```

### 3. Subscription Processing Flow

```
Cron Job triggers daily at configured time
    ↓
Fortiscron.php::process_recurrent_transactions()
    ↓
Query subscriptions with next_payment_on = TODAY
    ↓
For each subscription:
    ├── Load subscription details
    ├── Load customer payment source
    ├── Build fund allocation
    ├── Prepare transaction data
    ↓
    Call extensions/Payments.php::process()
        ↓
        FortisLib.php::createTransaction()
            ↓
            POST /v1/transactions/{cc|ach}/{sale|debit}/token
            ↓
            Process response
    ↓
    Success?
    ├── YES:
    │   ├── Increment success_trxns counter
    │   ├── Calculate next payment date
    │   └── Update subscription record
    └── NO:
        ├── Increment fail_trxns counter
        ├── If fail_trxns >= 4 && no previous success:
        │   └── Cancel subscription (status='D')
        └── Otherwise: retry next period
```

### 4. Refund Flow

```
Admin initiates refund from Dashboard
    ↓
Donations.php::refund()
    ↓
FortisLib.php::refundTransaction()
    ↓
Validate transaction is refundable
    ↓
Load merchant credentials from church_onboard_fortis
    ↓
PATCH /v1/transactions/{id}/refund
    ↓
Fortis processes refund
    ↓
Success?
    ├── YES:
    │   ├── Create negative transaction record
    │   ├── Link refund to original (trx_ret_id)
    │   ├── Update donor totals (subtract)
    │   ├── Create negative fund allocations
    │   └── Return success
    └── NO:
        ├── Log error
        └── Return error message
```

---

## Webhook System

### Webhook Endpoint
```
POST https://yourdomain.com/fortiswebhooks/merchant_account_status_listener
```

### Webhook Purpose
Fortis sends webhooks when merchant account status changes, primarily when:
1. Merchant completes application
2. Merchant account is approved
3. User credentials are generated

### Webhook Payload Example
```json
{
  "client_app_id": "123",
  "stage": "sandbox",
  "users": [
    {
      "user_id": "11e95f8ec39de8fbdb0a4f1a",
      "user_api_key": "abc123def456..."
    }
  ]
}
```

### Webhook Processing

**File**: `application/controllers/Fortiswebhooks.php`

```php
public function merchant_account_status_listener()
{
    // 1. Get webhook payload
    $input_json = @file_get_contents('php://input');
    $input = json_decode($input_json);
    
    // 2. Log to database
    $this->db->insert('fortis_webhooks', [
        'created_at' => date('Y-m-d H:i:s'),
        'event_json' => $input_json,
        'system' => 'lunarpay',
        'mode' => $input->stage
    ]);
    
    // 3. Find organization
    $organization = $this->organization_model->get($input->client_app_id);
    $account = $this->orgnx_onboard_fts_model->getByOrg($input->client_app_id);
    
    // 4. Extract user credentials
    if (isset($input->users) && count($input->users) > 0) {
        $userId = $input->users[0]->user_id;
        $userApiKey = $input->users[0]->user_api_key;
        
        // 5. Save credentials
        $saveData = [
            'id' => $account->id, 
            'auth_user_id' => $userId, 
            'auth_user_api_key' => $userApiKey, 
            'app_status' => 'ACTIVE'
        ];
        $this->orgnx_onboard_fts_model->update($saveData);
        
        // 6. Send email notification
        $this->sendEmailNotificationToMerchant($account, $organization);
        
        // 7. Return success
        $this->output(true, 200, 'Success!');
    }
}
```

### Multi-System Webhook Routing

LunarPay supports multiple systems (LunarPay, ChatGive) sharing one Fortis account. The webhook receiver routes webhooks to the correct system:

```php
private function seekFortisAccountAmongSystems($account_number)
{
    $this->load->library('curl');
    
    $sysIdFound = FALSE;
    foreach (FORTIS_MIRRORED_SYSTEMS as $sysId => $system) {
        $url = $system['base_url'] . 'fortiswebhooks/fortis_account_belongs_to_me/' . $account_number;
        $response = $this->curl->get($url);
        $responseArr = json_decode($response, true);
        
        if ($responseArr['status']) {
            $sysIdFound = $sysId;
            break;
        }
    }
    return $sysIdFound;
}
```

**Configuration** (`config/constants.php`):
```php
define('FORTIS_MIRRORED_SYSTEMS', [
    'lunarpay' => [
        'base_url' => 'https://app.lunarpay.com/'
    ],
    'chatgive' => [
        'base_url' => 'https://app.chatgive.com/'
    ]
]);
```

---

## Error Handling

### Reason Codes

Fortis returns reason codes for all transaction results. LunarPay maintains a complete mapping:

**File**: `FortisLib.php` lines 23-215

**Key Reason Codes**:
- `1000` - Approved (CC) / Accepted (ACH)
- `1500` - Generic Decline
- `1510` - Call issuer
- `1520` - Pickup Card
- `1616` - NSF (Insufficient Funds)
- `1622` - Card Expired
- `1625` - Card Not Permitted
- `1626` - Transaction Not Permitted
- `1660` - Bank Account Error

### ACH Return Codes

ACH transactions can return after initial acceptance (2101-2400 range):

**Common ACH Returns**:
- `2101` - Insufficient funds
- `2102` - Bank account closed
- `2103` - No bank account/unable to locate
- `2104` - Invalid bank account number
- `2107` - Authorization revoked by customer
- `2108` - Payment stopped
- `2110` - Customer advises originator not known

### Error Response Handling

```php
if ($response['error'] == 1 || 
    ($response['error'] == 0 && !isset($response['response']->data->id)) || 
    $response['response']->data->status_code == 301) {
    
    $_reason_code = isset($response['response']->data->reason_code_id) 
                    ? $response['response']->data->reason_code_id 
                    : FALSE;
    
    if($_reason_code !== FALSE) {
        $response['response']->data->_reason_message = 
            isset(self::REASON_CODES[$_reason_code]) 
            ? self::REASON_CODES[$_reason_code] 
            : '';
    }
    
    $updateData = [
        'request_response' => json_encode($response, JSON_PRETTY_PRINT),
        'epicpay_transaction_id' => $response['response']->data->id ?? null,
        'updated_at' => date('Y-m-d H:i:s'),
        'status' => 'N',
    ];
    
    $errorMessage = $response['response']->data->_reason_message ?? null;
    $response['message'] = $errorMessage
        ? "Uh-oh! We ran into a problem: $errorMessage"
        : "Reason code $_reason_code. Please contact your administrator.";
}
```

### Logging

**Development Mode** (`fortis_environment = 'dev'`):
All requests/responses logged to `request_logs` table:

```php
if ($this->testing) {
    $this->CI->db->insert('request_logs', [
        'object' => $url, 
        'type' => 'url', 
        'date' => date('Y-m-d H:i:s')
    ]);
    $this->CI->db->insert('request_logs', [
        'object' => $this->userId . ':' . $this->userApiKey, 
        'type' => 'auth', 
        'date' => date('Y-m-d H:i:s')
    ]);
    $this->CI->db->insert('request_logs', [
        'object' => $bodyString, 
        'type' => 'request', 
        'date' => date('Y-m-d H:i:s')
    ]);
}
```

---

## Database Schema

### church_onboard_fortis
Stores merchant onboarding details and API credentials.

```sql
CREATE TABLE church_onboard_fortis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  church_id INT,
  
  -- Signer information
  sign_first_name VARCHAR(100),
  sign_last_name VARCHAR(100),
  sign_phone_number VARCHAR(50),
  email VARCHAR(255),
  
  -- Merchant location
  merchant_address_line_1 VARCHAR(255),
  merchant_state VARCHAR(50),
  merchant_city VARCHAR(100),
  merchant_postal_code VARCHAR(20),
  
  -- Bank accounts (last 4 digits only)
  account_number_last4 VARCHAR(4),
  routing_number_last4 VARCHAR(4),
  account_holder_name VARCHAR(255),
  account2_number_last4 VARCHAR(4),
  routing2_number_last4 VARCHAR(4),
  account2_holder_name VARCHAR(255),
  
  -- Fortis application status
  app_status VARCHAR(50), -- 'BANK_INFORMATION_SENT', 'ACTIVE', 'FORM_ERROR'
  mpa_link TEXT, -- Merchant portal application link
  
  -- API credentials (received via webhook)
  location_id VARCHAR(255),
  product_transaction_id VARCHAR(255),
  auth_user_id VARCHAR(255),
  auth_user_api_key VARCHAR(255),
  
  -- Audit
  processor_response TEXT,
  created_at DATETIME,
  updated_at DATETIME,
  
  FOREIGN KEY (church_id) REFERENCES church(ch_id)
);
```

### fortis_webhooks
Logs all webhook events received.

```sql
CREATE TABLE fortis_webhooks (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_json TEXT,
  system VARCHAR(50), -- 'lunarpay' or 'chatgive'
  mode VARCHAR(20), -- 'sandbox' or 'production'
  created_at DATETIME,
  INDEX idx_system (system),
  INDEX idx_mode (mode)
);
```

### epicpay_customer_transactions
Main transaction table (reused from EpicPay, works for Fortis).

```sql
Key fields:
- epicpay_transaction_id VARCHAR(255) -- Stores Fortis transaction ID
- request_data TEXT -- Stores request payload
- request_response TEXT -- Stores API response
- status CHAR(1) -- 'P'=Success, 'N'=Failed, 'R'=Refunded
- status_ach VARCHAR(10) -- 'W'=Waiting, 'P'=Processed, 'F'=Failed (ACH only)
- src VARCHAR(10) -- 'CC' or 'BNK'
```

---

## Testing

### Test Mode Configuration

```php
// .env file
fortis_environment=dev

// This enables:
// 1. Sandbox API URLs
// 2. Test credentials
// 3. Request/response logging
// 4. Test template code
```

### Test Template Code
```php
$merchantData['template_code'] = $test ? 'Testing1234' : 'ActiveBase4';
```

### Test Credit Cards
Fortis sandbox accepts standard test cards:
- Visa: `4111111111111111`
- Mastercard: `5499740000000057`
- Amex: `371449635392376`
- Discover: `6011000991001201`

### Test Bank Accounts
Use any valid routing number format with test account numbers.

---

## Security Considerations

### Credential Storage
- API keys encrypted in database using `fortis_encrypt_phrase`
- Bank account numbers: only last 4 digits stored
- Full account numbers never persisted

### PCI Compliance
- Payment card data collected via Fortis Elements (client-side)
- Card numbers never touch server
- Only tokens stored server-side

### API Authentication
- Separate credentials per merchant
- Developer ID remains constant
- User ID + API Key unique per merchant
- All stored encrypted in `church_onboard_fortis` table

---

## Support & Documentation

### Official Fortis Docs
- API Documentation: https://docs.fortis.tech/v/1_0_0
- Reason Codes: https://docs.fortis.tech/v/1_0_0#/rest/models/enumerations/reason-code-id-1
- Elements Integration: https://docs.fortis.tech/elements

### LunarPay Internal
- Main configuration: `application/config/config.php`
- Constants: `application/config/constants_ext.php`
- Helper functions: `application/helpers/fortis_helper.php`

---

**Document Version**: 1.0  
**Last Updated**: November 2024  
**Fortis API Version**: v1  
**Status**: Complete Endpoint Documentation

