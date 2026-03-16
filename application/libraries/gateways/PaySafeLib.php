<?php

if (!defined('BASEPATH'))
    exit('No direct script access allowed');

/**
 * PaySafe class to handle all inbound and outbound requests
 *
 */
class PaySafeLib {

    const TABLE_CUSTOMERS          = 'epicpay_customers';
    const TABLE_CUSTOMER_WH        = 'paysafe_webhooks';
    const TABLE_CUSTOMER_SOURCES   = 'epicpay_customer_sources';
    const TABLE_CUSTOMER_SUBS      = 'epicpay_customer_subscriptions';
    const TABLE_CUSTOMER_TRX       = 'epicpay_customer_transactions';
    const TABLE_CUSTOMER_TRX_TR    = 'epicpay_customer_trx_transfers';
    const TABLE_MOBILE_TRX         = 'mobile_transaction';    
    const URL                      = 'https://api.paysafe.com/';
    const URL_TEST                 = 'https://api.test.paysafe.com/';

    private $encryptPhrase;
    private $userName;
    private $userPass;
    private $agentCredentials;
    private $testing               = false;
    private $logSensibleData       = FALSE; // WARNING PUT IT TO FALSE ON PRD/LIVE ENVIRONMENT
    private $paysafe_product_codes = [];
    public $paysafe_environment    = null;
    private $mainUserId            = null;
    private $onctX = 0;

    function __construct() {
        $this->CI = & get_instance();

        $this->CI->load->helper('paysafe');
        
        $this->encryptPhrase = $this->CI->config->item('pty_epicpay_encrypt_phrase');

        $this->paysafe_environment = $this->CI->config->item('paysafe_environment');

        if ($this->paysafe_environment === null || $this->paysafe_environment === 'dev') {
            $this->setTesting(true);
        } else if ($this->paysafe_environment === 'prd') {
            $this->setTesting(false);
            $this->logSensibleData = false; // WARNING PUT IT TO FALSE ON PRD/LIVE ENVIRONMENT
        } else {
            throw new Exception('Internal error, incorrect payment processor settings');
        }

        $this->CI->load->library('encryption');

        $this->CI->encryption->initialize([
            'cipher' => 'aes-256',
            'mode'   => 'ctr',
            'key'    => $this->encryptPhrase,
                ]
        );
       
        //SYSTEM_LETTER_ID is included as reference when making a payment or creating some resources on the payment processor side, for example a trnx id sent would be something like SYSTEM_LETTER_ID . '-' . $trxId...;
        //SYSTEM_LETTER_ID => L = Lunarpay, C = Chatgive, H = CoachPay 
        $this->CI->load->model('setting_model');        
        $this->SYSTEM_LETTER_ID = $this->CI->setting_model->getItem('SYSTEM_LETTER_ID');        
    }

    public function setMainUserId($userId) {
        $this->mainUserId = $userId;
    }

    //get single use api key for sending credit card data to the payment provider directly without touching our server
    public function getSingleUseTokenEncodedApiKey() {

        $string = null;
        if ($this->testing) {
            $string = PAYSAFE_SINGLE_USE_API_KEY_USER_TEST . ':' . PAYSAFE_SINGLE_USE_API_KEY_PASS_TEST;
        } else {
            $string = PAYSAFE_SINGLE_USE_API_KEY_USER_LIVE . ':' . PAYSAFE_SINGLE_USE_API_KEY_PASS_LIVE;
        }

        return base64_encode($string);
    }

    public function setTesting($value) {
        if ($value) {

            $this->paysafe_product_codes = PAYSAFE_PRODUCT_CODES_TEST;

            $this->userName = $this->CI->config->item('paysafe_partner_user_test');
            $this->userPass = $this->CI->config->item('paysafe_partner_passsword_test');
        } else {

            $this->paysafe_product_codes = PAYSAFE_PRODUCT_CODES_LIVE;

            $this->userName = $this->CI->config->item('paysafe_partner_user_live');
            $this->userPass = $this->CI->config->item('paysafe_partner_passsword_live');
        }
        $this->testing = $value;
    }
    
    public function getTesting() {
        return $this->testing;
    }

    public function getProductCodeSettings($currency, $account_type, $tier_index) {
        $currency = strtoupper($currency);

        if (isset($this->paysafe_product_codes[$currency][$account_type]['codes'][$tier_index]['code'])) {
            return $this->paysafe_product_codes[$currency][$account_type]['codes'][$tier_index]['code'];
        } else {
            throw new Exception('Internal error, product code not found');
        }
    }

    public function setAgentCredentials($agentCredentials) {
        $this->agentCredentials = $agentCredentials;
    }

    /* --- --- Platform Account Management --- --- */

    /*     * **************************************************************************
     *
     * Create merchant/church  
     *  
     * $data['payload']['name'] = string;
     *
     * *************************************************************************** */

    public function create_merchant($data) {

        $response = $this->_makeCurlRequest('accountmanagement/v1/merchants', $data['payload'], 'post');
        return $response;
    }

    /*     * *****************************************************************************
     *
     * Create merchant account consolidated includes the address - that's all! so we don't need to make a new one api call for address
     * 
     * $data['merchant_id'] = MERCHANT_ID
     * $data['payload']['name'] = MERCHANT_NAME
     * $data['payload']['processingCurrency'] = 'USD';
     * $data['payload']['currency'] = 'USD';
     * $data['payload']['region'] = 'US';
     * $data['payload']['legalEntity'] = 'New Merchant Corp.';
     * $data['payload']['productCode'] = '23950';
     * $data['payload']['category'] = 'CHARITY';
     * $data['payload']['phone'] = '5558889999';
     * $data['payload']['yearlyVolumeRange'] = 'LOW';
     * $data['payload']['averageTransactionAmount'] = 1000; //cannot be zero
     * $data['payload']['merchantDescriptor']['dynamicDescriptor'] = 'newmerchant';
     * $data['payload']['merchantDescriptor']['phone'] = '5558889999';     
     * $data['payload']['address'] = [
     *  'street' => '100 Queen Street West',
     *  'street2' => 'Apt. 245',
     *  'city' => 'Miami',
     *  'state' => 'FL',
     *  'country' => 'US',
     *  'zip' => 'zipcode'
     * ];     
     *  $data['payload']['tradingAddress'] = [
     *   'street' => '100 Queen Street West',
     *   'street2' => 'Suite 1200',
     *   'city' => 'Miami',
     *   'state' => 'FL',
     *   'country' => 'US',
     *   'zip' => 'zipcode'
     *  ];     
     * *************************************************************************** */

    public function create_merchant_account_consolidated($data) {

        $response = $this->_makeCurlRequest('accountmanagement/v1/merchants/' . $data['merchant_id'] . '/accounts?operationMode=consolidated', $data['payload'], 'post');
        return $response;
    }

    /*     * *****************************************************************************
     *
     * Create merchant business owner consolidated includes the address - that's all! 
     * 
     * $data['account_id'] = ACCOUNT_ID
     * $data['payload'] = [
     *  'firstName' => 'James',
     *  'lastName' => 'Ronald',
     *  'jobTitle' => 'CEO',
     *  'phone' => '5556667777',
     *  'dateOfBirth' => [
     *      'day' => '15',
     *      'month' => '9',
     *      'year' => '1978'
     *  ],
     *  'ssn' => '999888777',
     *  'currentAddress' => [
     *    'street' => '100 Queen Street West',
     *    'street2' => 'Apt. 245',
     *    'city' => 'Miami',
     *    'state' => 'FL',
     *    'country' => 'US',
     *    'zip' => 'M5H2N2',
     *    'yearsAtAddress' => '2'
     *  ],
     *  'previousAddress' => [
     *    'street' => '100 Queen Street West',
     *    'street2' => 'Apt. 245',
     *    'city' => 'Miami',
     *    'state' => 'FL',
     *    'country' => 'US',
     *    'zip' => 'M5H2N2',
     *    'yearsAtAddress' => '2'
     *  ]
     * ]        
     * *************************************************************************** */

    public function create_merchant_business_owner_consolidated($data) {

        $response = $this->_makeCurlRequest('accountmanagement/v1/accounts/' . $data['account_id'] . '/businessowners?operationMode=consolidated', $data['payload'], 'post');
        return $response;
    }

    /*     * *****************************************************************************
     *
     * Create a back office user
     * $data['account_id'] = ACCOUNT_ID
     * $data['payload'] = [
     *   'userName' => 'john_smith',
     *   'password"=> "Pwd1234!',
     *   'email' => 'johnsmith@email.com',
     *   'recoveryQuestion' => [
     *   'questionId' => 1,
     *   'answer' => 'John Michael'
     *   ]
     * ];
     * *************************************************************************** */

    public function create_backoffice_user($data) {
        $response = $this->_makeCurlRequest('accountmanagement/v1/accounts/' . $data['account_id'] . '/users', $data['payload'], 'post');
        return $response;
    }

    /*     * *****************************************************************************
     *
     * Create ACH Bank
     * $data['account_id'] = ACCOUNT_ID
     * $data['payload'] = [
     *   'accountNumber' => '5807560412853954',
     *   'routingNumber' => '854117563'
     * ]
     * *************************************************************************** */

    public function create_ach_bank($data) {
        $response = $this->_makeCurlRequest('accountmanagement/v1/accounts/' . $data['account_id'] . '/achbankaccounts', $data['payload'], 'post');
        return $response;
    }

    public function create_sepa_bank($data) {
        $response = $this->_makeCurlRequest('accountmanagement/v1/accounts/' . $data['account_id'] . '/sepabankaccounts', $data['payload'], 'post');
        return $response;
    }

    public function create_bacs_bank($data) {
        $response = $this->_makeCurlRequest('accountmanagement/v1/accounts/' . $data['account_id'] . '/bacsbankaccounts', $data['payload'], 'post');
        return $response;
    }

    public function create_eft_bank($data) {
        $response = $this->_makeCurlRequest('accountmanagement/v1/accounts/' . $data['account_id'] . '/eftbankaccounts', $data['payload'], 'post');
        return $response;
    }

    public function create_wire_bank($data) {
        $response = $this->_makeCurlRequest('accountmanagement/v1/accounts/' . $data['account_id'] . '/wirebankaccounts', $data['payload'], 'post');
        return $response;
    }

    public function delete_ach_bank($data) {
        $response = $this->_makeCurlRequest('accountmanagement/v1/achbankaccounts/' . $data['bank_id'], $data['payload'], 'delete');
        return $response;
    }

    public function get_recovery_questions() {
        $response = $this->_makeCurlRequest('accountmanagement/v1/recoveryquestions', null, 'get');
        return $response;
    }

    public function get_bank_details() {
        $response = $this->_makeCurlRequest('accountmanagement/v1/bankaccounts/metadata?country=US&region=US&currency=USD', null, 'get');
        return $response;
    }

    public function get_terms_conditions($data) {
        //d('accountmanagement/v1/accounts/' . $data['account_id'] . '/termsandconditions?version=' . $data['tc_version']);
        //$response = $this->_makeCurlRequest('accountmanagement/v1/accounts/' . $data['account_id'] . '/termsandconditions?version=' . $data['tc_version'], null, 'get', 'html');
        $response = $this->_makeCurlRequest('accountmanagement/v1/accounts/' . $data['account_id'] . '/termsandconditions', null, 'get', 'html');
        return $response;
    }

    public function accept_terms_conditions($data) {
        $response = $this->_makeCurlRequest('accountmanagement/v1/accounts/' . $data['account_id'] . '/termsandconditions', $data['payload'], 'post');
        return $response;
    }

    public function activation_request($data) {
        $response = $this->_makeCurlRequest('accountmanagement/v1/accounts/' . $data['account_id'] . '/activation', '{}', 'post');
        return $response;
    }

    public function create_microdeposit($data) {
        $response = $this->_makeCurlRequest('accountmanagement/v1/bankaccounts/' . $data['bank_id'] . '/microdeposits', '{}', 'post');
        return $response;
    }

    public function validate_microdeposit($data) {
        $response = $this->_makeCurlRequest('accountmanagement/v1/microdeposits/' . $data['bank_microdeposit_id'] . '/validate', $data['payload'], 'post');
        return $response;
    }
    
    public function get_microdeposit($data) {
        $response = $this->_makeCurlRequest('accountmanagement/v1/microdeposits/' . $data['microdeposit_id'], null, 'get');
        return $response;
    }

    public function get_account($data) {

        $response = $this->_makeCurlRequest('accountmanagement/v1/accounts/' . $data['account_id'] . '?operationMode=consolidated', null, 'get');
        return $response;
    }

    /* --- --- Platform Accounts Management End */

    ////////////////////////////////////////////////////////////////////////////////////////


    /* --- --- Merchant Operations */
    
    public function createTransaction($transactionData, $customerData, $paymentData, $fund_data, $productsWithRequest = null, $isAnonymous = false) {
        
        $requestBody = [];

        $requestBody['amount'] = $paymentData['amount'];

        $bank_type = $paymentData['bank_type'];

        if ($paymentData['method'] == 'credit_card') {
            $singleUseTokenUsed                   = true;
            $requestBody['card']                  = [
                'paymentToken' => $paymentData['credit_card']['single_use_token']
            ];
            //important
            //The zip/postal code must be provided for an AVS check request.
            $requestBody['billingDetails']['zip'] = $customerData['paysafe_billing_address']['zip'];

            $requestBody['settleWithAuth'] = true;

            //d($requestBody);
        } else if ($paymentData['method'] == 'wallet') {

            if ($transactionData["src"] == "CC") {
                $requestBody['card'] = [
                    'paymentToken' => $paymentData['wallet']['wallet_id']
                ];

                if (isset($transactionData['customer_subscription_id']) && $transactionData['customer_subscription_id']) { //if payments is being triggered from a subscription
                    $requestBody['storedCredential']['type'] = 'RECURRING';

                    if (!$paymentData['success_trxns']) { // if this is the first attempt for a recurring payment
                        $requestBody['storedCredential']['occurrence'] = 'INITIAL';
                    } else {
                        $requestBody['storedCredential']['occurrence'] = 'SUBSEQUENT';
                    }
                }

                $requestBody['billingDetails']['zip'] = $paymentData['wallet']['postal_code'];

                $requestBody['settleWithAuth'] = true;
            } elseif ($transactionData["src"] == "BNK") {
                if ($bank_type == 'ach') {
                    $requestBody['ach'] = [
                        'paymentToken' => $paymentData['wallet']['wallet_id'],
                        'payMethod'    => $paymentData['sec_code']
                    ];
                } elseif ($bank_type == 'eft') {
                    $requestBody['eft'] = [
                        'paymentToken' => $paymentData['wallet']['wallet_id']
                    ];
                } elseif ($bank_type == 'sepa') {
                    $requestBody['sepa'] = [
                        'paymentToken' => $paymentData['wallet']['wallet_id']
                    ];
                } elseif ($bank_type == 'bacs') {
                    $requestBody['bacs'] = [
                        'paymentToken' => $paymentData['wallet']['wallet_id']
                    ];
                }

                //billingDetails not added we expect it's took from the source vault from paysafe as billingAddress is required for creating bank accounts
            }
            //The zip/postal code must be provided for an AVS check request.
        } else if ($paymentData['method'] == 'echeck') {

            require_once 'application/libraries/gateways/Paysafe/BanksHandler.php';

            if ($bank_type == 'ach') {

                if(!isset($customerData['paysafe_billing_address']['state']) || empty($customerData['paysafe_billing_address']['state'])){
                    return ['error' => 1, 'message' => 'The State is required'];
                }

                if(!isset($customerData['paysafe_billing_address']['zip']) || empty($customerData['paysafe_billing_address']['zip'])){
                    return ['error' => 1, 'message' => 'The Zip Code is required'];
                }

                $requestBody['ach'] = Paysafe\BanksHandler::buildAchData($paymentData, $customerData);
                unset($requestBody['ach']['billingAddress']); //when creating a payment without saving the payment source billingAddress in not required in the object
            } elseif ($bank_type == 'eft') {
                $requestBody['eft'] = Paysafe\BanksHandler::buildEftData($paymentData, $customerData);
                unset($requestBody['eft']['billingAddress']); //when creating a payment without saving the payment source billingAddress in not required in the object
            } elseif ($bank_type == 'sepa' || $bank_type == 'bacs') {
                return ['error' => 1, 'message' => ucfirst($bank_type) . ' transactions are only available using a saved source '];
            }
            //These are the billing details for the request. Note that this object is required for the request only when a payment token is not provided.
            $requestBody['billingDetails'] = $customerData['paysafe_billing_address'];
        }

        if (isset($customerData['customer']['id'])) {
            $requestBody['client_customer_id'] = $customerData['customer']['id'];
        }

        $transactionData['request_data'] = $requestBody;
        $transactionData['created_at']   = date('Y-m-d H:i:s');

        $transactionData['bank_type'] = $bank_type;

        if (!$this->logSensibleData) {
            // Protect credit card or bank information //
            
            if (isset($transactionData['request_data']['ach']['accountNumber']))
                $transactionData['request_data']['ach']['accountNumber'] = '....';
            if (isset($transactionData['request_data']['ach']['routingNumber']))
                $transactionData['request_data']['ach']['routingNumber'] = '....';
            
            if (isset($transactionData['request_data']['eft']['accountNumber']))
                $transactionData['request_data']['eft']['accountNumber'] = '....';
            if (isset($transactionData['request_data']['eft']['transitNumber']))
                $transactionData['request_data']['eft']['transitNumber'] = '....';
            if (isset($transactionData['request_data']['eft']['institutionId']))
                $transactionData['request_data']['eft']['institutionId'] = '....';
        }
        //check    

        $transactionData['request_data']['merchantRefNum'] = $this->SYSTEM_LETTER_ID . '-check-paysafeRef';

        $church_onboard = $this->CI->db->where('church_id', $transactionData['church_id'])->get('church_onboard_paysafe')->row();

        if ($transactionData["src"] == "CC") {
            $endPoint = 'cardpayments/v1/accounts/' . $church_onboard->account_id . '/auths';
        } elseif ($transactionData["src"] == "BNK") {
            if ($bank_type == 'ach') {
                $endPoint = 'directdebit/v1/accounts/' . $church_onboard->account_id2 . '/purchases';
            } elseif ($bank_type == 'eft') {
                $endPoint = 'directdebit/v1/accounts/' . $church_onboard->account_id3 . '/purchases';
            } elseif ($bank_type == 'sepa') {
                $endPoint = 'directdebit/v1/accounts/' . $church_onboard->account_id4 . '/purchases';
            } elseif ($bank_type == 'bacs') {
                $endPoint = 'directdebit/v1/accounts/' . $church_onboard->account_id5 . '/purchases';
            } else {
                return ['error' => 1, 'message' => 'Bank type not defined'];
            }
        }

        $transactionData['request_data']['_endPoint']         = $endPoint;
        $transactionData['request_data']['_single_use_token'] = isset($singleUseTokenUsed) && $singleUseTokenUsed ?: false;

        $transactionData['request_data'] = json_encode($transactionData['request_data']);
        $transactionData["from_domain"]  = base_url();
        $transactionData['donor_ip']     = get_client_ip_from_trusted_proxy();

       
//        $cIpResponse = $this->ipIsBlackListed($transactionData['donor_ip']);
//        if ($cIpResponse !== false) {
//            return $cIpResponse;
//        }
//
//        $cTestResponse = $this->checkCardTesting($transactionData);
//        if ($cTestResponse !== false) {
//            return $cTestResponse;
//        }

        $this->CI->db->insert(self::TABLE_CUSTOMER_TRX, $transactionData);
        $trxId = $this->CI->db->insert_id();
        
        // --- When payment link request: products must be saved as a log of the payment, products quantities and prices are variable but the payment 
        // --- must be saved as a snapshot
        if(isset($transactionData['payment_link_id']) && $transactionData['payment_link_id']) {
            $this->CI->load->model('payment_link_product_paid_model');
            $this->CI->load->model('product_model');
              
            foreach($productsWithRequest as $row) {
                
                if ($row->recurrence == Product_model::RECURRENCE_ONE_TIME) { //one time only, avoiding recurring
                    $prdDataSave = [
                        'transaction_id'  => $trxId,
                        'payment_link_id' => $transactionData['payment_link_id'],
                        'product_id'      => $row->product_id,
                        'product_name'    => $row->product_name,
                        'product_price'   => $row->product_price,
                        'qty_req'         => $row->_qty_req,
                    ];
                    $this->CI->payment_link_product_paid_model->save($prdDataSave);
                }
            }
        }
        
        
        $this->CI->load->model('transaction_fund_model', 'trnx_funds');
        
        //validating create customer_subscription_id when transaction comes text to give
        $customer_subscription_id = isset($transactionData['customer_subscription_id']) && $transactionData['customer_subscription_id'] ? $transactionData['customer_subscription_id'] : null;
        
        foreach($fund_data as $row) {
            $trnxFundData = [
                'transaction_id' => $trxId,
                'fund_id'        => $row['fund_id'],
                'amount'         => $row['_fund_amount'],
                'fee'            => $row['_fund_fee'],
                'net'            => $row['_fund_sub_total_amount']
            ];
            
            $this->CI->trnx_funds->register($trnxFundData, $customer_subscription_id);
        }
        
        $requestBody['merchantRefNum'] = $this->SYSTEM_LETTER_ID . '-' . $trxId . '-' . date('YmdHis', strtotime($transactionData['created_at']));
        
        $response = $this->_makeCurlRequest($endPoint, $requestBody, 'post');
        
        $response["trxId"] = $trxId;
        
        if ($response['error'] == 1 || ($response['error'] == 0 && isset($response['response']->error)) || $response['response'] == null) {
            $updateData = [
                'request_response' => json_encode($response),
                'updated_at'       => date('Y-m-d H:i:s'),
                'status'           => 'N',
                'paysafeRef'       => $requestBody['merchantRefNum']
            ];

            $response['error']   = 1;
            $response['message'] = isset($response['response']->error->message) ? $response['response']->error->message : 'Unknown error. Please contact your administrator';
        } else {

            $updateData = [
                'request_response'       => json_encode($response),
                'epicpay_transaction_id' => isset($response['response']->id) ? $response['response']->id : null,
                'updated_at'             => date('Y-m-d H:i:s'),
                'status'                 => 'P',
                'status_ach'             => $transactionData["src"] == "BNK" ? 'P' : null,
                'paysafeRef'             => $requestBody['merchantRefNum']
            ];

            $response['error'] = 0;
           
            //if ($transactionData["src"] != 'BNK') {

            $donationAcumData = [
                'id'          => $transactionData['account_donor_id'],
                'amount_acum' => $transactionData['total_amount'],
                'fee_acum'    => $transactionData['fee'],
                'net_acum'    => $transactionData['sub_total_amount']
            ];

            if(!$isAnonymous) {
                $this->CI->donor_model->updateDonationAcum($donationAcumData);
            }
            //}
            
            //create a pdf receipt
            $this->CI->load->model('donation_model');
            $updateData['receipt_file_uri_hash'] = $this->CI->donation_model->createReceiptPdf($trxId);            
        }
        
        
        $this->CI->db->update(self::TABLE_CUSTOMER_TRX, $updateData, ['id' => $trxId]);
        
        return $response;
    }

    /*     * **************************************************************************
     *
     * Create subscription
     *
     * @param    array     $transactionData holds data of the transaction
     * @param    array     $customerData holds data of the customer
     * @param    array     $paymentData holds data of the payment source
     * @return   array     [error, message]
     *
     *
     * *************************************************************************** */

    public function createSubscription($transactionData, $customerData, $paymentData, $fund_data, $paymentLink = false) {
     
        $requestBody           = [];
        $requestBody['amount'] = $paymentData['amount'];
        $requestBody['method'] = $paymentData['method'];

        $current_time = (int) date('Hi');
        $limit_time   = 2300;

        if ($current_time > $limit_time) {
            if (date('Y-m-d', strtotime($paymentData['next_payment_date'])) == date('Y-m-d')) {
                // ------ if a subscription is created after limit time and the subscription starts "today" pospone payment to the next day
                // ------ we do this to allow the cron job to trigger all subscriptions of the day till "limit_time". 
                // ------ if not we would be losing subs payments after the cron is executed
                $paymentData['next_payment_date'] = date('Y-m-d', strtotime('+1 day' . $paymentData['next_payment_date']));
            }
        }
            
        // Create subscription
        $subscriptionData = [
            'customer_id'             => $transactionData['customer_id'],
            'customer_source_id'      => $transactionData['customer_source_id'],
            'church_id'               => $transactionData['church_id'],
            'campus_id'               => $transactionData['campus_id'],
            'frequency'               => $paymentData['frequency'],
            'start_on'                => $paymentData['next_payment_date'],
            'next_payment_on'         => $paymentData['next_payment_date'],
            'amount'                  => $transactionData['total_amount'],
            'account_donor_id'        => $transactionData['account_donor_id'],
            'first_name'              => $transactionData['first_name'],
            'last_name'               => $transactionData['last_name'],
            'email'                   => $transactionData['email'],
            'zip'                     => $paymentData['wallet']['postal_code'],
            'giving_source'           => $transactionData['giving_source'],
            //'giving_type'        => $transactionData['giving_type'],
            'epicpay_template'        => $transactionData['template'],
            'src'                     => $transactionData['src'],
            'is_fee_covered'          => $transactionData['is_fee_covered'],
            //'multi_transaction_data' => $transactionData['multi_transaction_data'],            
            'tags'                    => isset($transactionData['tags']) ? $transactionData['tags'] : null,
            'campaign_id'             => $transactionData['campaign_id'],
            'epicpay_customer_id'     => $paymentData['wallet']['processor_customer_id'],
            'epicpay_wallet_id'       => $paymentData['wallet']['wallet_id'],
            'epicpay_subscription_id' => null,
            //'request_response'        => json_encode($response),
            'updated_at'              => date('Y-m-d H:i:s'),
            'status'                  => 'A',
            'ispaysafe'               => 1,
            //save the payment_link_product.ID as reference of the product linked to the subscription | always expecting one record inside the array
            'payment_link_products_id' => $paymentLink ? $paymentLink->_products_with_request[0]->id : null,
            'white_label_tag'          => isset($transactionData['white_label_tag']) && $transactionData['white_label_tag'] ? $transactionData['white_label_tag'] : null
                //'request_data'       => $transactionData['request_data']
        ];
       
        $subscriptionData['created_at'] = date('Y-m-d H:i:s');        
        
        $this->CI->db->insert(self::TABLE_CUSTOMER_SUBS, $subscriptionData);
        $subId                          = $this->CI->db->insert_id();
        
        
        $this->CI->load->model('transaction_fund_model', 'trnx_funds');
        
        foreach($fund_data as $row) {
            $trnxFundData = [
                'subscription_id' => $subId,
                'fund_id'         => $row['fund_id'],
                'amount'          => $row['_fund_amount'],
                'fee'             => $row['_fund_fee'],
                'net'             => $row['_fund_sub_total_amount']
            ];

            $this->CI->trnx_funds->register($trnxFundData);
        }
        
        // --- When payment link request: products must be saved as a log of the payment, products quantities and prices are variable but the payment 
        // --- must be saved as a snapshot
        if($paymentLink) {
            $this->CI->load->model('payment_link_product_paid_model');
            $this->CI->load->model('product_model');
                        
            //productsWithRequest when subscription only will hold one product | it must come validated, it is a recurrent/susbscription product
            
            foreach ($paymentLink->_products_with_request as $row) {                
                $prdDataSave = [
                    'subscription_id' => $subId,
                    'payment_link_id' => $transactionData['payment_link_id'],
                    'product_id'      => $row->product_id,
                    'product_name'    => $row->product_name,
                    'product_price'   => $row->product_price,
                    'qty_req'         => $row->_qty_req,
                ];
                $this->CI->payment_link_product_paid_model->save($prdDataSave);
            }
        }

        $response['error'] = 0;
        $today             = date('Y-m-d');        
        
        //Do not trigger the transaction in CUSTOM products whose first payment is not of the day 
        if ($paymentData['frequency'] == 'Custom' && $paymentData['next_payment_date'] > $today) {

            $response['payment_info'] = ['payment_done' => true, 'trxn_id' => null];
            
        } else {
        
        //manually pull the subscription/payment trigger only for the current subscription
        $subPaymentResponse    = file_get_contents(BASE_URL . 'paysafecron/process_recurrent_transactions/' . $subId);             
        
        $subPaymentResponseObj = json_decode($subPaymentResponse);

        if(!isset($subPaymentResponseObj->summary) || !$subPaymentResponseObj->summary) {
            echo 'ERROR FROM process_recurrent_transactions: ' . $subPaymentResponse;
        }

        if ($subPaymentResponseObj->summary->count && count($subPaymentResponseObj->summary->subs_success) == 1) {
            $trxn_id                  = $subPaymentResponseObj->summary->subs_success[0]->trxn_id;
            $response['payment_info'] = ['payment_done' => true, 'trxn_id' => $trxn_id, 'subscription_id' => $subId];
        } else {
            $response['payment_info'] = ['payment_done' => false, 'trxn_id' => null, 'subscription_id' => $subId, 'payment_response' => $subPaymentResponseObj];
        }
        }
        return $response;
    }

    //========== creates a new customer with a source, if the customer exists it adds the source only
    public function createCustomer($customerData, $paymentData) {
        if($paymentData['bank_type'] == 'ach' && (!isset($customerData['paysafe_billing_address']['state']) || empty($customerData['paysafe_billing_address']['state']))){
            return ['error' => 1, 'message' => 'The State is required'];
        }

        if($paymentData['bank_type'] == 'ach' && (!isset($customerData['paysafe_billing_address']['zip']) || empty($customerData['paysafe_billing_address']['state']))){
            return ['error' => 1, 'message' => 'The Zip Code is required'];
        }

        require_once 'application/libraries/gateways/Paysafe/BanksHandler.php';

        if (!isset($customerData['customer_address'])) {
            return ['error' => 1, 'message' => 'The customer address is required'];
        }

        $customerExists = false;
        $dbCustomer     = null;
        $bank_type      = null;

        $avsRestrict = ['NO_MATCH']; //avs responses that will be handled as an error
        $cvvRestrict = ['NO_MATCH']; //cvv responses that will be handled as an error

        if ($customerData['account_donor_id'] > 0) {
            $dbCustomer = $this->CI->db->where('account_donor_id', $customerData['account_donor_id'])
                            ->where('church_id', $customerData['church_id'])
                            ->where('status', 'P')
                            ->where('ispaysafe', '1')
                            ->order_by('id', 'desc')
                            ->get(self::TABLE_CUSTOMERS)->row();

            if ($dbCustomer) {
                $customerExists = true;
            }
        }

        if (!$customerExists) {
            $requestBody = [
                'method' => $paymentData['method']
            ];

            $paymentMethodLastDigits = null;

            $now = date('Y-m-d H:i:s');
            $this->CI->db->insert(self::TABLE_CUSTOMERS, [
                'email'            => $customerData['customer_address']['email'],
                'first_name'       => $customerData['customer_address']['first_name'],
                'last_name'        => $customerData['customer_address']['last_name'],
                'church_id'        => $customerData['church_id'],
                'account_donor_id' => $customerData['account_donor_id'],
                'created_at'       => $now,
                'ispaysafe'        => '1',
            ]);

            $customerId = $this->CI->db->insert_id();

            if ($paymentData['method'] == 'credit_card') {
                $requestBody['card'] = [
                    'singleUseToken' => $paymentData['credit_card']['single_use_token']
                ];

                //card verification
                $this->CI->load->model('orgnx_onboard_psf_model');
                $onboard_psf                 = $this->CI->orgnx_onboard_psf_model->getByOrg($customerData['church_id'], $this->mainUserId, ['account_id']);
                $verificationData['payload'] = [
                    'card'             => [
                        'paymentToken' => $paymentData['credit_card']['single_use_token']
                    ],
                    'merchantRefNum'   => $this->SYSTEM_LETTER_ID . '-verify' . '-p-' . $customerId . '-' . date('YmdHis', strtotime($now)),
                    'storedCredential' => [
                        'occurrence' => 'INITIAL'
                    ],
                    'billingDetails'   => [
                        'zip' => $customerData['customer_address']['postal_code'],
                        //'street'    => 'NTest Address' //simluate avs
                    ]
                ];

                $verificationData['account_id'] = $onboard_psf->account_id;

                $verifyResp = $this->verification($verificationData);

                $verifyResp['_verification_endpoint'] = true;
                if ($verifyResp['error'] == 1 || ($verifyResp['error'] == 0 && isset($verifyResp['response']->error)) || 
                        (isset($verifyResp['response']->avsResponse) && in_array($verifyResp['response']->avsResponse, $avsRestrict)) || 
                        (isset($verifyResp['response']->cvvVerification) && in_array($verifyResp['response']->cvvVerification, $cvvRestrict))) {
                
                    $this->CI->db->where('id', $customerId)->update(self::TABLE_CUSTOMERS, [
                        'request_data'     => json_encode($verificationData),
                        'request_response' => json_encode($verifyResp),
                        'status'           => 'E',
                        'updated_at'       => date('Y-m-d H:i:s'),
                    ]);

                    $response['error'] = 1;

                    if (isset($verifyResp['response']->avsResponse) && in_array($verifyResp['response']->avsResponse, $avsRestrict)) {
                        $response['message'] = "Your request has failed the AVS check. Please ensure the zip is accurate before retrying the operation";
                    } elseif (isset($verifyResp['response']->cvvVerification) && in_array($verifyResp['response']->cvvVerification, $cvvRestrict)) {
                        $response['message'] = "Your request has failed the cvv check. Please ensure the cvv is accurate before retrying the operation";
                    } else {
                        $response['message'] = isset($verifyResp['response']->error->message) ? $verifyResp['response']->error->message : 'Network error';
                    }
                    
                    return $response;
                }
                //-- end card verification
            } 

            $requestBody['locale'] = 'en_US';

            $tst = '';
            $tst = '_' . date('Ymdhis');

            $xid                               = $customerData['church_id'] . '_' . ((string) $customerId) . $tst;
            $merchant_customer_id              = $this->paysafe_environment == 'dev' ? 'dev_' . ($xid) : $xid;
            $requestBody['merchantCustomerId'] = $merchant_customer_id;
            //$merchant_customer_id = '4320210127050250';

            $requestBody2 = $requestBody;

            $this->CI->db->where('id', $customerId)->update(self::TABLE_CUSTOMERS, [
                'merchant_customer_id' => $merchant_customer_id,
                'request_data'         => json_encode($requestBody2),
            ]);

            $requestBody['merchantCustomerId'] = $merchant_customer_id;

            $response = $this->_makeCurlRequest('customervault/v1/profiles', $requestBody, 'post');

            if ($response['error'] == 1 || ($response['error'] == 0 && isset($response['response']->error))) {
                $response['error'] = 1;

                $this->CI->db->where('id', $customerId)->update(self::TABLE_CUSTOMERS, [
                    'request_response' => json_encode($response),
                    'status'           => 'E',
                    'updated_at'       => date('Y-m-d H:i:s'),
                ]);

                $response['message'] = $response['response']->error->message;

                return $response;
            }

            $responseBank    = null;
            $walletId        = null;
            $paysafeSourceId = null;

            if ($requestBody['method'] == 'credit_card') {
                $walletId        = $response['response']->cards[0]->paymentToken;
                $paysafeSourceId = $response['response']->cards[0]->id;
                $nameHolder      = $paymentData['credit_card']['card_holder_name'];
            } elseif ($requestBody['method'] == 'echeck') {
                //create bank source, creating profile including bank data is not responding with bank id so we do the the stuff like this
                $bank_type = $paymentData['bank_type'];

                if ($bank_type == 'ach') {
                    $requestBodyBank['bank'] = Paysafe\BanksHandler::buildAchData($paymentData, $customerData);
                    $paymentMethodLastDigits = substr($requestBodyBank['bank']['accountNumber'], -4);
                    $responseBank            = $this->_makeCurlRequest('customervault/v1/profiles/' . $response['response']->id . '/achbankaccounts', $requestBodyBank['bank'], 'post');
                } elseif ($bank_type == 'eft') {
                    $requestBodyBank['bank'] = Paysafe\BanksHandler::buildEftData($paymentData, $customerData);
                    $paymentMethodLastDigits = substr($requestBodyBank['bank']['accountNumber'], -4);
                    $responseBank            = $this->_makeCurlRequest('customervault/v1/profiles/' . $response['response']->id . '/eftbankaccounts', $requestBodyBank['bank'], 'post');
                } elseif ($bank_type == 'sepa') {
                    $requestBodyBank['bank'] = Paysafe\BanksHandler::buildSepaData($paymentData, $customerData);
                    $paymentMethodLastDigits = substr($requestBodyBank['bank']['iban'], -4);
                    $responseBank            = $this->_makeCurlRequest('customervault/v1/profiles/' . $response['response']->id . '/sepabankaccounts', $requestBodyBank['bank'], 'post');
                } elseif ($bank_type == 'bacs') {
                    $requestBodyBank['bank'] = Paysafe\BanksHandler::buildBacsData($paymentData, $customerData);
                    $paymentMethodLastDigits = substr($requestBodyBank['bank']['accountNumber'], -4);
                    $responseBank            = $this->_makeCurlRequest('customervault/v1/profiles/' . $response['response']->id . '/bacsbankaccounts', $requestBodyBank['bank'], 'post');
                } else {
                    throw new Exception('Payment method not available');
                }

                $requestBodyBank2 = $requestBodyBank;

                if (!$this->logSensibleData) {
                    // Protect credit card or bank information //
                    if (isset($requestBodyBank2['bank']['accountNumber']))
                        $requestBodyBank2['bank']['accountNumber'] = '....';
                    if (isset($requestBodyBank2['bank']['routingNumber']))
                        $requestBodyBank2['bank']['routingNumber'] = '....';
                    if (isset($requestBodyBank2['bank']['transitNumber']))
                        $requestBodyBank2['bank']['transitNumber'] = '....';
                    if (isset($requestBodyBank2['bank']['institutionId']))
                        $requestBodyBank2['bank']['institutionId'] = '....';
                    if (isset($requestBodyBank2['bank']['iban']))
                        $requestBodyBank2['bank']['iban']          = '....';
                    if (isset($requestBodyBank2['bank']['sortCode']))
                        $requestBodyBank2['bank']['sortCode']      = '....';
                }
                $requestBodyBank2['bank']['_bank_type'] = $bank_type;

                if ($responseBank['error'] == 1 || ($responseBank['error'] == 0 && isset($responseBank['response']->error))) {
                    $responseBank['error'] = 1;

//!!!!!!!!!!!!!!!!!!!!!!!!!!//!!!!!!!!!!!!!!!!!!!!!!!!!!//!!!!!!!!!!!!!!!!!!!!!!!!!!//!!!!!!!!!!!!!!!!!!!!!!!!!!//!!!!!!!!!!!!!!!!!!!!!!!!!!
                    $responseBank['routingNumber'] = '....';
//!!!!!!!!!!!!!!!!!!!!!!!!!!//!!!!!!!!!!!!!!!!!!!!!!!!!!//!!!!!!!!!!!!!!!!!!!!!!!!!!//!!!!!!!!!!!!!!!!!!!!!!!!!!//!!!!!!!!!!!!!!!!!!!!!!!!!!

                    $this->CI->db->where('id', $customerId)->update(self::TABLE_CUSTOMERS, [
                        'request_bank'          => json_encode($requestBodyBank2['bank']),
                        'request_response_bank' => json_encode($responseBank),
                        'updated_at'            => date('Y-m-d H:i:s'),
                    ]);

                    $responseBank['message'] = $responseBank['response']->error->message;

                    return $responseBank;
                }

                $paysafeSourceId = $responseBank['response']->id;
                $walletId        = in_array($bank_type, ['sepa', 'bacs']) ? $responseBank['response']->mandates[0]->paymentToken : $responseBank['response']->paymentToken;
                $nameHolder      = $paymentData['bank_account']['account_holder_name'];
            }

            $this->CI->db->where('id', $customerId)->update(self::TABLE_CUSTOMERS, [
                'epicpay_customer_id'   => $response['response']->id,
                'request_response'      => isset($verifyResp) ? json_encode(['card_verification' => $verifyResp, 'profile_response' => $response]) : json_encode($response),
                'request_bank'          => isset($requestBodyBank2['bank']) ? json_encode($requestBodyBank2['bank']) : null,
                'request_response_bank' => isset($responseBank) ? json_encode($responseBank) : null,
                'billing_address'       => isset($customerData['paysafe_billing_address']) ? json_encode($customerData['paysafe_billing_address']) : null,
                'status'                => 'P',
                'updated_at'            => date('Y-m-d H:i:s'),
            ]);


            $this->CI->db->insert(self::TABLE_CUSTOMER_SOURCES, [
                'customer_id'                => $customerId,
                'church_id'                  => $customerData['church_id'],
                'account_donor_id'           => $customerData['account_donor_id'],
                'source_type'                => $paymentData['method'] == 'credit_card' ? 'card' : 'bank',
                'bank_type'                  => $bank_type,
                'last_digits'                => $paymentData['method'] == 'credit_card' ? $response['response']->cards[0]->lastDigits : $paymentMethodLastDigits,
                'name_holder'                => $nameHolder,
                'epicpay_wallet_id'          => $walletId,
                'paysafe_source_id'          => $paysafeSourceId,
                'epicpay_customer_id'        => $response['response']->id,
                'is_active'                  => 'Y',
                'is_saved'                   => $customerData['is_saved'],
                'status'                     => 'P',
                'exp_month'                  => $paymentData['method'] == 'credit_card' ? $response['response']->cards[0]->cardExpiry->month : null,
                'exp_year'                   => $paymentData['method'] == 'credit_card' ? $response['response']->cards[0]->cardExpiry->year : null,
                'postal_code'                => $customerData['customer_address']['postal_code'],
                'request_data'               => 'check-customer',
                'created_at'                 => date('Y-m-d H:i:s'),
                'ispaysafe'                  => '1',
                'paysafe_billing_address_id' => null,
                'paysafe_billing_address'    => isset($customerData['paysafe_billing_address']) ? json_encode($customerData['paysafe_billing_address']) : null
            ]);


            $customerSourceId     = $this->CI->db->insert_id();
            $response['customer'] = ['id' => $customerId, 'epicpay_id' => $response['response']->id];
            $response['source']   = ['id' => $customerSourceId, 'epicpay_id' => $walletId, 'postal_code' => $customerData['customer_address']['postal_code']];

            return $response;
            // END NEW CUSTOMER
        } else {
            $requestBody = [
                'customer_id' => $dbCustomer->epicpay_customer_id,
                'method'      => $paymentData['method']
            ];

            $paymentMethodLastDigits = null;

            if ($paymentData['method'] == 'credit_card') {
                $requestBody['card'] = [
                    'singleUseToken' => $paymentData['credit_card']['single_use_token']
                ];
            } else if ($paymentData['method'] == 'echeck') {

                $responseAddress = $this->_makeCurlRequest('customervault/v1/profiles/' . $requestBody['customer_id'] . '/addresses', $customerData['paysafe_billing_address'], 'post');

                if ($responseAddress['error'] == 1 || ($responseAddress['error'] == 0 && isset($responseAddress['response']->error))) {
                    //===== error 
                    $responseAddress['error']   = 1;
                    $responseAddress['message'] = $responseAddress['response']->error->message;

                    return $responseAddress;
                }

                $bank_type = $paymentData['bank_type'];

                if ($bank_type == 'ach') {
                    $requestBody['bank']     = Paysafe\BanksHandler::buildAchData($paymentData, $customerData, $responseAddress['response']->id);
                    $paymentMethodLastDigits = substr($requestBody['bank']['accountNumber'], -4);
                } elseif ($bank_type == 'eft') {
                    $requestBody['bank']     = Paysafe\BanksHandler::buildEftData($paymentData, $customerData, $responseAddress['response']->id);
                    $paymentMethodLastDigits = substr($requestBody['bank']['accountNumber'], -4);
                } elseif ($bank_type == 'sepa') {
                    $requestBody['bank']     = Paysafe\BanksHandler::buildSepaData($paymentData, $customerData, $responseAddress['response']->id);
                    $paymentMethodLastDigits = substr($requestBody['bank']['iban'], -4);
                } elseif ($bank_type == 'bacs') {
                    $requestBody['bank']     = Paysafe\BanksHandler::buildBacsData($paymentData, $customerData, $responseAddress['response']->id);
                    $paymentMethodLastDigits = substr($requestBody['bank']['accountNumber'], -4);
                } else {
                    throw new Exception('Payment method not available');
                }
            }

            $requestBody2 = $requestBody;

            if (!$this->logSensibleData) {
                // Protect credit card or bank information
                if (isset($requestBody2['bank']['accountNumber']))
                    $requestBody2['bank']['accountNumber'] = '....';
                if (isset($requestBody2['bank']['routingNumber']))
                    $requestBody2['bank']['routingNumber'] = '....';
                if (isset($requestBody2['bank']['transitNumber']))
                    $requestBody2['bank']['transitNumber'] = '....';
                if (isset($requestBody2['bank']['institutionId']))
                    $requestBody2['bank']['institutionId'] = '....';
                if (isset($requestBody2['bank']['iban']))
                    $requestBody2['bank']['iban']          = '....';
                if (isset($requestBody2['bank']['sortCode']))
                    $requestBody2['bank']['sortCode']      = '....';
            }
            $requestBody2['_bank_type'] = $bank_type;

            $nameHolder = $paymentData['method'] == 'credit_card' ? $paymentData['credit_card']['card_holder_name'] : $paymentData['bank_account']['account_holder_name'];

            $now = date('Y-m-d H:i:s');
            $this->CI->db->insert(self::TABLE_CUSTOMER_SOURCES, [
                'customer_id'                => $dbCustomer->id,
                'church_id'                  => $customerData['church_id'],
                'account_donor_id'           => $customerData['account_donor_id'],
                'source_type'                => $paymentData['method'] == 'credit_card' ? 'card' : 'bank',
                'bank_type'                  => $bank_type,
                'name_holder'                => $nameHolder,
                'is_active'                  => 'Y',
                'is_saved'                   => $customerData['is_saved'],
                'postal_code'                => $customerData['customer_address']['postal_code'],
                'request_data'               => json_encode($requestBody2),
                'created_at'                 => $now,
                'ispaysafe'                  => '1',
                'paysafe_billing_address_id' => isset($responseAddress['response']->id) ? $responseAddress['response']->id : null,
                'paysafe_billing_address'    => isset($customerData['paysafe_billing_address']) ? json_encode($customerData['paysafe_billing_address']) : null
            ]);

            $customerSourceId = $this->CI->db->insert_id();

            if ($requestBody['method'] == 'credit_card') {
                //card verification
                $this->CI->load->model('orgnx_onboard_psf_model');
                $onboard_psf                 = $this->CI->orgnx_onboard_psf_model->getByOrg($customerData['church_id'], $this->mainUserId, ['account_id']);
                $verificationData['payload'] = [
                    'card'             => [
                        'paymentToken' => $paymentData['credit_card']['single_use_token']
                    ],
                    'merchantRefNum'   => $this->SYSTEM_LETTER_ID . '-verify' . '-c-' . $customerSourceId . '-' . date('YmdHis', strtotime($now)),
                    'storedCredential' => [
                        'occurrence' => 'INITIAL'
                    ],
                    'billingDetails'   => [
                        'zip' => $customerData['customer_address']['postal_code'],
                    //'street'    => 'NTest Address' //simluate avs
                    ]
                ];

                $verificationData['account_id'] = $onboard_psf->account_id;

                $verifyResp = $this->verification($verificationData);

                $verifyResp['_verification_endpoint'] = true;
                if ($verifyResp['error'] == 1 || ($verifyResp['error'] == 0 && isset($verifyResp['response']->error)) || 
                        (isset($verifyResp['response']->avsResponse) && in_array($verifyResp['response']->avsResponse, $avsRestrict)) || 
                        (isset($verifyResp['response']->cvvVerification) && in_array($verifyResp['response']->cvvVerification, $cvvRestrict))) {

                    $this->CI->db->where('id', $customerSourceId)->update(self::TABLE_CUSTOMER_SOURCES, [
                        'request_data'     => json_encode($verificationData),
                        'request_response' => json_encode($verifyResp),
                        'status'           => 'E',
                        'updated_at'       => date('Y-m-d H:i:s'),
                    ]);

                    $response['error'] = 1;

                    if (isset($verifyResp['response']->avsResponse) && in_array($verifyResp['response']->avsResponse, $avsRestrict)) {
                        $response['message'] = "Your request has failed the AVS check. Please ensure the zip is accurate before retrying the operation";
                    } elseif (isset($verifyResp['response']->cvvVerification) && in_array($verifyResp['response']->cvvVerification, $cvvRestrict)) {
                        $response['message'] = "Your request has failed the cvv check. Please ensure the cvv is accurate before retrying the operation";
                    } else {
                        $response['message'] = isset($verifyResp['response']->error->message) ? $verifyResp['response']->error->message : 'Network error';
                    }

                    return $response;
                }

                //-- end card verification

                $response = $this->_makeCurlRequest('customervault/v1/profiles/' . $requestBody['customer_id'] . '/cards', $requestBody['card'], 'post');
            } elseif ($requestBody['method'] == 'echeck') {
                if ($bank_type == 'ach') {
                    $response = $this->_makeCurlRequest('customervault/v1/profiles/' . $requestBody['customer_id'] . '/achbankaccounts', $requestBody['bank'], 'post');
                } elseif ($bank_type == 'eft') {
                    $response = $this->_makeCurlRequest('customervault/v1/profiles/' . $requestBody['customer_id'] . '/eftbankaccounts', $requestBody['bank'], 'post');
                } elseif ($bank_type == 'sepa') {
                    $response = $this->_makeCurlRequest('customervault/v1/profiles/' . $requestBody['customer_id'] . '/sepabankaccounts', $requestBody['bank'], 'post');
                } elseif ($bank_type == 'bacs') {
                    $response = $this->_makeCurlRequest('customervault/v1/profiles/' . $requestBody['customer_id'] . '/bacsbankaccounts', $requestBody['bank'], 'post');
                } else {
                    throw new Exception('Payment method not available YET');
                }
            }

            if ($response['error'] == 1 || ($response['error'] == 0 && isset($response['response']->error))) {

                $this->CI->db->where('id', $customerSourceId)->update(self::TABLE_CUSTOMER_SOURCES, [
                    'request_response' => json_encode($response),
                    'status'           => 'E',
                    'updated_at'       => date('Y-m-d H:i:s'),
                ]);

                $response['error']   = 1;
                $response['message'] = $response['response']->error->message;

                return $response;
            }

            $walletId = in_array($bank_type, ['sepa', 'bacs']) ? $response['response']->mandates[0]->paymentToken : $response['response']->paymentToken;

            $this->CI->db->where('id', $customerSourceId)->update(self::TABLE_CUSTOMER_SOURCES, [
                'last_digits'         => $paymentData['method'] == 'credit_card' ? $response['response']->lastDigits : $paymentMethodLastDigits,
                'exp_month'           => $paymentData['method'] == 'credit_card' ? $response['response']->cardExpiry->month : null,
                'exp_year'            => $paymentData['method'] == 'credit_card' ? $response['response']->cardExpiry->year : null,
                'epicpay_wallet_id'   => $walletId,
                'paysafe_source_id'   => $response['response']->id,
                'epicpay_customer_id' => $dbCustomer->epicpay_customer_id,
                'request_response'    => isset($verifyResp) ? json_encode(['card_verification' => $verifyResp, 'source_response' => $response]) : json_encode($response),
                'status'              => 'P'
            ]);

            $response['customer'] = ['id' => $dbCustomer->id, 'epicpay_id' => $dbCustomer->epicpay_customer_id];
            $response['source']   = ['id' => $customerSourceId, 'epicpay_id' => $walletId, 'postal_code' => $customerData['customer_address']['postal_code']];

            return $response;
            // END USING EXISTING CUSTOMER
        }
    }

    /*     * **************************************************************************
     *
     * Delete Customer Source
     *
     * @param    int    $donor_id holds the id of the source
     * @param    int    $source_id holds the id of the source
     * @return   array     [error, message]
     *
     *
     * *************************************************************************** */

    public function deleteCustomerSource($source_id, $donor_id) {

        $this->CI->load->model('sources_model');
        $source = $this->CI->sources_model->getOne($donor_id, $source_id, ['id', 'church_id', 'epicpay_customer_id', 'epicpay_wallet_id', 'paysafe_source_id', 'source_type', 'bank_type'], true);

        if (!$source) {
            return ['error' => 1, 'message' => 'Invalid source'];
        }

        if ($source->source_type == 'card') {
            $response = $this->_makeCurlRequest('customervault/v1/profiles/' . $source->epicpay_customer_id . '/cards/' . $source->paysafe_source_id, null, 'delete');
        } elseif ($source->source_type == 'bank') {
            if ($source->bank_type == 'ach') {
                $response = $this->_makeCurlRequest('customervault/v1/profiles/' . $source->epicpay_customer_id . '/achbankaccounts/' . $source->paysafe_source_id, null, 'delete');
            } elseif ($source->bank_type == 'eft') {
                $response = $this->_makeCurlRequest('customervault/v1/profiles/' . $source->epicpay_customer_id . '/eftbankaccounts/' . $source->paysafe_source_id, null, 'delete');
            } elseif ($source->bank_type == 'sepa') {
                $response = $this->_makeCurlRequest('customervault/v1/profiles/' . $source->epicpay_customer_id . '/sepabankaccounts/' . $source->paysafe_source_id, null, 'delete');
            } elseif ($source->bank_type == 'bacs') {
                $response = $this->_makeCurlRequest('customervault/v1/profiles/' . $source->epicpay_customer_id . '/bacsbankaccounts/' . $source->paysafe_source_id, null, 'delete');
            } else {
                return ['error' => 1, 'message' => 'Bank type not defined'];
            }
        }

        $updateData['response_delete'] = json_encode($response);

        if ($response['error'] == 1 || ($response['error'] == 0 && isset($response['response']->error))) {
            $response['error']   = 1;
            $response['message'] = $response['response']->error->message;
        } else {
            $updateData['updated_at'] = date('Y-m-d H:i:s');
            $updateData['status']     = 'D';
            $updateData['is_active']  = 'N';

            $response['error'] = 0;
        }

        /* --- UPDATE ALL DUPLICATED WALLETS --- */
        $this->CI->db
                ->where('church_id', $source->church_id)
                ->where('account_donor_id', $donor_id)
                ->where('epicpay_wallet_id', $source->epicpay_wallet_id)
                ->update(self::TABLE_CUSTOMER_SOURCES, $updateData);

        return $response;
    }

    /*     * **************************************************************************
     *
     * Stop Customer Subscription
     *
     * @param    array     $subscriptionId holds the id of the subscription
     * @return   array     [error, message]
     *
     *
     * *************************************************************************** */

    public function stopCustomerSubscription($subscriptionId, $user_id = false, $donor_id = false) {

        if ($user_id) {
            $result = checkBelongsToUser([
                ['epicpay_customer_subscriptions.id' => $subscriptionId, 'church_id', 'church_detail.ch_id'],
                ['church_detail.ch_id' => '?', 'client_id', 'users.id', $user_id],
            ]);
            if ($result !== true) {
                return $result;
            }
            $subscription = $this->CI->db->where('id', $subscriptionId)->get(self::TABLE_CUSTOMER_SUBS)->row();
        } else {
            $subscription = $this->CI->db->where('id', $subscriptionId)->where('account_donor_id', $donor_id)->get(self::TABLE_CUSTOMER_SUBS)->row();
        }


        if (!$subscription) {
            return ['error' => 1, 'message' => 'Invalid Id'];
        }

        if ($subscription->status == 'D') {
            return ['error' => 1, 'message' => 'Subscription already canceled'];
        }

        $updateData['updated_at']   = date('Y-m-d H:i:s');
        $updateData['cancelled_at'] = date('Y-m-d H:i:s');
        $updateData['status']       = 'D';
        $response['error']          = 0;

        $this->CI->db->where('id', $subscriptionId)->update(self::TABLE_CUSTOMER_SUBS, $updateData);

        return $response;
    }

    /*     * **************************************************************************
     *
     * Refund transaction
     *
     * @param    array     $trxId holds the id of the transaction
     * @return   array     [error, message]
     *
     *
     * *************************************************************************** */

    public function refundTransaction($trxId) {
        $transaction = $this->CI->db->where('id', $trxId)->get(self::TABLE_CUSTOMER_TRX)->row();

        if (!$transaction || $transaction->epicpay_transaction_id == null || strlen($transaction->epicpay_transaction_id) == 0) {
            return ['error' => 1, 'message' => 'The current transaction cannot be refunded. Please contact your administrator'];
        }

        if ($transaction->status == 'R') {
            return ['error' => 1, 'message' => 'Transaction already refunded'];
        }

        $refundData = [
            'customer_id'              => $transaction->customer_id,
            'customer_source_id'       => $transaction->customer_source_id,
            'customer_subscription_id' => $transaction->customer_subscription_id,
            'church_id'                => $transaction->church_id,
            'campus_id'                => $transaction->campus_id,
            'account_donor_id'         => $transaction->account_donor_id,
            'donor_ip'                 => $transaction->donor_ip,
            'sub_total_amount'         => $transaction->total_amount * -1,
            'total_amount'             => $transaction->total_amount * -1,
            'fee'                      => 0,
            'first_name'               => $transaction->first_name,
            'last_name'                => $transaction->last_name,
            'email'                    => $transaction->email,
            'giving_source'            => $transaction->giving_source,
            'src'                      => $transaction->src,
            'template'                 => $transaction->template,
            'status'                   => 'N',
            'trx_retorigin_id'         => $trxId,
            'trx_type'                 => 'RE',
            'created_at'               => date('Y-m-d H:i:s'),
        ];

        $trxnResponse = json_decode($transaction->request_response);

        $church_onboard = $this->CI->db->where('church_id', $transaction->church_id)->get('church_onboard_paysafe')->row();
        if ($transaction->src == "CC") {
            $merchant_account_id          = $church_onboard->account_id;
            $requestBody                  = [
                //'amount'           => $transaction->total_amount * 100,
                'merchantRefNum' => $trxnResponse->response->merchantRefNum,
            ];
            $refundData['refund_request'] = json_encode($requestBody);
            $settlement_id                = $trxnResponse->response->settlements[0]->id;
            $response                     = $this->_makeCurlRequest('cardpayments/v1/accounts/' . $merchant_account_id . '/settlements/' . $settlement_id . '/refunds', $requestBody, 'post');
        } elseif ($transaction->src == "BNK") {
            $merchant_account_id          = $church_onboard->account_id2;
            $requestBody                  = [
                'status' => 'CANCELLED'
            ];
            $refundData['refund_request'] = json_encode($requestBody);
            $purchase_id                  = $trxnResponse->response->id;
            $response                     = $this->_makeCurlRequest('directdebit/v1/accounts/' . $merchant_account_id . '/purchases/' . $purchase_id, $requestBody, 'put');
        }
        //

        $refundData['refund_response'] = json_encode($response);

        //////////////////////////////////////////
        if (false) {
            //if ($transaction->src == "CC" && isset($response['response']->error->code) && $response['response']->error->code == 3406) {
            /* --- IF ERROR = 3406 THE TRANSACTION WAS NOT SETTLED, TRY THE REFUND AGAIN WITH "VOID" --- */
            /// BUT ///
            //------- You cannot process an authorization reversal transaction against an authorization that has been settled.
            $requestBody                   = [
                'amount'         => $transaction->total_amount * 100,
                'merchantRefNum' => $trxnResponse->response->merchantRefNum,
            ];
            $refundData['refund_request']  = json_encode($requestBody);
            $auth_id                       = $trxnResponse->response->id;
            $response                      = $this->_makeCurlRequest('cardpayments/v1/accounts/' . $merchant_account_id . '/auths/' . $auth_id . '/voidauths', $requestBody, 'post');
            $refundData['refund_response'] .= json_encode($response);
            d($response);
        }

        if ($response['error'] == 1 || ($response['error'] == 0 && isset($response['response']->error))) {
        //if (false) {
            $response['error']   = 1;
            $error_add_text      = isset($response['response']->error->code) && $response['response']->error->code == 3406 ? 'Try again later' : '';
            $response['message'] = isset($response['response']->error->message) ? ($response['response']->error->message . ' ' . $error_add_text) : 'Unknown error. Please contact your administrator';
        } else {

            $refundData['status'] = 'P';

            $this->CI->load->model('donor_model');
            $donationAcumData  = [
                'id'          => $refundData['account_donor_id'],
                'amount_acum' => $refundData['total_amount'],
                'fee_acum'    => 0,
                'net_acum'    => $refundData['sub_total_amount']
            ];
            $this->CI->donor_model->updateDonationAcum($donationAcumData);
            $response['error'] = 0;
        }

        $this->CI->db->insert(self::TABLE_CUSTOMER_TRX, $refundData);
        $refund_trx_id = $this->CI->db->insert_id();

        $this->CI->load->model('transaction_fund_model', 'trnx_funds');
        $trnx_funds = $this->CI->trnx_funds->getByTransaction($trxId);
        
        foreach ($trnx_funds as $fund) {
            $trnxFundData = [
                'transaction_id' => $refund_trx_id,
                'fund_id'        => $fund['fund_id'],
                'amount'         => $fund['amount'] * -1,
                'fee'            => 0,
                'net'            => $fund['amount'] * -1,
            ];

            $this->CI->trnx_funds->register($trnxFundData);
        }
        if ($response['error'] == 0) {
            $trxnUpdate['trx_ret_id'] = $refund_trx_id;
            $this->CI->db->where('id', $trxId)->update(self::TABLE_CUSTOMER_TRX, $trxnUpdate);
        }

        return $response;
    }

    //set as failed works the same as refunded but it does not call paysafe
    public function setAsFailed($trxId) {
        $transaction = $this->CI->db->where('id', $trxId)->get(self::TABLE_CUSTOMER_TRX)->row();

        if (!$transaction || $transaction->epicpay_transaction_id == null || strlen($transaction->epicpay_transaction_id) == 0) {
            return ['error' => 1, 'message' => 'The current transaction cannot be set as failed. Please contact your administrator'];
        }

        if ($transaction->manual_failed) {
            return ['error' => 1, 'message' => 'The current transaction is already marked as failed'];
        }

        $refundData = [
            'customer_id'              => $transaction->customer_id,
            'customer_source_id'       => $transaction->customer_source_id,
            'customer_subscription_id' => $transaction->customer_subscription_id,
            'church_id'                => $transaction->church_id,
            'campus_id'                => $transaction->campus_id,
            'account_donor_id'         => $transaction->account_donor_id,
            'donor_ip'                 => $transaction->donor_ip,
            'sub_total_amount'         => $transaction->total_amount * -1,
            'total_amount'             => $transaction->total_amount * -1,
            'fee'                      => 0,
            'first_name'               => $transaction->first_name,
            'last_name'                => $transaction->last_name,
            'email'                    => $transaction->email,
            'giving_source'            => $transaction->giving_source,
            'src'                      => $transaction->src,
            'template'                 => $transaction->template,
            'status'                   => 'P',
            'trx_retorigin_id'         => $trxId,
            'trx_type'                 => 'RE',
            'created_at'               => date('Y-m-d H:i:s'),
        ];

        $refundData['manual_failed'] = 1;

        $this->CI->load->model('donor_model');
        $donationAcumData  = [
            'id'          => $refundData['account_donor_id'],
            'amount_acum' => $refundData['total_amount'],
            'fee_acum'    => 0,
            'net_acum'    => $refundData['sub_total_amount']
        ];
        $this->CI->donor_model->updateDonationAcum($donationAcumData);
        $response['error'] = 0;

        $this->CI->db->insert(self::TABLE_CUSTOMER_TRX, $refundData);
        $refund_trx_id = $this->CI->db->insert_id();

        $this->CI->load->model('transaction_fund_model', 'trnx_funds');
        $trnx_funds = $this->CI->trnx_funds->getByTransaction($trxId);

        foreach ($trnx_funds as $fund) {
            $trnxFundData = [
                'transaction_id' => $refund_trx_id,
                'fund_id'        => $fund['fund_id'],
                'amount'         => $fund['amount'] * -1,
                'fee'            => 0,
                'net'            => $fund['amount'] * -1,
            ];

            $this->CI->trnx_funds->register($trnxFundData);
        }
        $trxnUpdate['trx_ret_id'] = $refund_trx_id;

        $trxnUpdate['status'] = 'P';
        if ($transaction->src == 'BNK') {
            $trxnUpdate['status_ach'] = 'P';
        }

        $trxnUpdate['manual_failed'] = 1;

        $this->CI->db->where('id', $trxId)->update(self::TABLE_CUSTOMER_TRX, $trxnUpdate);

        return $response;
    }

    public function processUpdateWallet($source, $request) {

        $billingAddress = $request['billingAddress'];

        $responseAddress = $this->_makeCurlRequest('customervault/v1/profiles/' . $source->epicpay_customer_id . '/addresses', $billingAddress, 'post');

        if ($responseAddress['error'] == 1 || ($responseAddress['error'] == 0 && isset($responseAddress['response']->error))) {
            //===== error 
            $responseAddress['error']   = 1;
            $responseAddress['message'] = isset($responseAddress['response']->error->message) ? $responseAddress['response']->error->message : 'Unknown error. Please contact your administrator';

            return $responseAddress;
        }

        //Convert 2 digits year to 4 digits year
        if(strlen($request["cardExpiry"]["year"]) == 2){
            $request["cardExpiry"]["year"] = getCardFullYear($request["cardExpiry"]["year"]);
        }

        $this->CI->db->where("id", $source->id)->update("epicpay_customer_sources", [
            "request_data_update" => json_encode($request),
            "updated_at"          => date("Y-m-d H:i:s")
        ]);

        $requestBody                     = $request;
        $requestBody['billingAddressId'] = $responseAddress['response']->id;
        unset($requestBody['billingAddress']);

        $response = $this->_makeCurlRequest('customervault/v1/profiles/' . $source->epicpay_customer_id . '/cards/' . $source->paysafe_source_id, $requestBody, 'put');

        $response["_response_at"] = date("Y-m-d H:i:s");

        $save_resp = [];
        if ($source->request_response_update) {
            $save_resp = json_decode($source->request_response_update);
        }
        $save_resp[] = $response;

        if ($response['error'] == 1 || ($response['error'] == 0 && isset($response['response']->error))) {
            $this->CI->db->where("id", $source->id)->update("epicpay_customer_sources", [
                "request_response_update" => json_encode($save_resp),
                "updated_at"              => date("Y-m-d H:i:s")
            ]);

            $response['error']   = 1;
            $response['message'] = isset($response['response']->error->message) ? $response['response']->error->message : 'Unknown error. Please contact your administrator';
        } else {
            // ----- sucesss
            $this->CI->db->where("id", $source->id)->update("epicpay_customer_sources", [
                "request_response_update"    => json_encode($save_resp),
                "updated_at"                 => date("Y-m-d H:i:s"),
                "name_holder"                => $request["holderName"],
                "postal_code"                => $request["billingAddress"]["zip"],
                "exp_month"                  => $request["cardExpiry"]["month"],
                "exp_year"                   => $requestBody["cardExpiry"]["year"],
                "ask_wallet_update"          => null,
                'paysafe_billing_address_id' => $responseAddress['response']->id,
                'paysafe_billing_address'    => isset($request['billingAddress']) ? json_encode($request['billingAddress']) : null
            ]);
        }

        return $response;
    }

    //Card verification | stuff done prior saving the source or making a payment
    public function verification($data) {

        $response = $this->_makeCurlRequest('cardpayments/v1/accounts/' . $data['account_id'] . '/verifications', $data['payload'], 'post');
        return $response;
    }

    public function authorize($data) {

        $response = $this->_makeCurlRequest('cardpayments/v1/accounts/' . $data['account_id'] . '/auths', $data['payload'], 'post');
        return $response;
    }

    private function _makeCurlRequest($path, $body = null, $method = 'post', $getFormat = null) {

        $url       = $this->testing ? self::URL_TEST . $path : self::URL . $path;
        $secretKey = base64_encode($this->userName . ':' . $this->userPass);

        if (is_string($body)) {
            $bodyString = $body;
        } else {
            $bodyString = json_encode($body);
        }

        $request_headers   = [];
        $request_headers[] = 'Authorization: Basic ' . $secretKey;
        $request_headers[] = 'Content-Type: application/json';
        $ch                = curl_init();

        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
        curl_setopt($ch, CURLOPT_HEADER, $getFormat == 'html' ? TRUE : FALSE);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $request_headers);

        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);

        if($this->testing) {                        
            $this->CI->db->insert('request_logs', ['object' => $url, 'type' => 'url', 'date' => date('Y-m-d H:i:s')]);
            $this->CI->db->insert('request_logs', ['object' => $this->userName . ':' . $this->userPass, 'type' => 'auth', 'date' => date('Y-m-d H:i:s')]);
            $this->CI->db->insert('request_logs', ['object' => $bodyString, 'type' => 'request', 'date' => date('Y-m-d H:i:s')]);
        }
        
        if ($method === 'post') {
            curl_setopt($ch, CURLOPT_POST, TRUE);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $bodyString);
        } elseif ($method === 'put') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PUT");
            curl_setopt($ch, CURLOPT_POSTFIELDS, $bodyString);
        } elseif ($method === 'delete') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "DELETE");
        } elseif ($method === 'get') {
            /* --- Continue! --- */
        }

        $rHeaders = [];
        if ($getFormat == 'html') {
            curl_setopt($ch, CURLOPT_HEADERFUNCTION, function($curl, $header) use (&$rHeaders) {
                $len    = strlen($header);
                $header = explode(':', $header, 2);
                if (count($header) < 2) // ignore invalid headers
                    return $len;

                $rHeaders[strtolower(trim($header[0]))][] = trim($header[1]);

                return $len;
            });

            $data_raw = curl_exec($ch);

            $header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
            $body        = substr($data_raw, $header_size);

            if (curl_errno($ch)) {
                $error_msg = curl_error($ch);
                curl_close($ch);
                return ['error' => 1, 'response' => $error_msg . ' | Try again'];
            } else {
                curl_close($ch);
                $data = json_decode($body);
                if (isset($data->error)) {
                    return ['error' => 0, 'response' => $data];
                }
                return ['response' => $body, 'headers' => $rHeaders];
            }
        } else {
            $data = curl_exec($ch);
            
            if($this->testing) {
                $this->CI->db->insert('request_logs', ['object' => $data, 'type' => 'response', 'date' => date('Y-m-d H:i:s')]);
            }
        }

        if (curl_errno($ch)) {
            $error_msg = curl_error($ch);
            curl_close($ch);
            return ['error' => 1, 'response' => $error_msg . ' | Try again'];
        } else {
            curl_close($ch);
            $response = json_decode($data);
            if(is_string($response)) {
                return ['error' => 1, 'response' => $response];
            }
            
            return ['error' => 0, 'response' => $response];
            
        }
    }

    private function ipIsBlackListed($ip) {
        $reg = $this->CI->db->where('ip', $ip)->where('status', '1')->order_by('id', 'desc')->get('giving_blacklisted_ips')->row();
        if ($reg) {
            $response['error']   = 1;
            $response['message'] = 'Please contact your administrator, error 9972';
            return $response;
        }
        return false;
    }

    private function checkCardTesting($transactionData) {

        //====== allow to make #trnxs inside #time window after that ip will be blocked
        $time_window  = 100;
        $trnxs_window = 5;

        $request_ip = $transactionData['donor_ip'];

        $lastTrnxs = $this->CI->db->where('donor_ip', $request_ip)->where_not_in('status', 'U')->order_by('id', 'desc')
                        ->limit($trnxs_window)->get(PtyEpicPay::TABLE_CUSTOMER_TRX)->result();

        if (count($lastTrnxs) < $trnxs_window) {
            return false;
        }

        $last_trnx = end($lastTrnxs);
        if ($last_trnx) {
            $time_diff = time() - strtotime($last_trnx->created_at);
            if ($time_diff < $time_window) {
                //===== block ip!                
                $obj_log = json_encode([
                    'request'          => $transactionData,
                    'last_trnx_window' => $last_trnx,
                    'time_window'      => $time_window,
                    'trnxs_window'     => $trnxs_window,
                    'time_diff_window' => $time_diff,
                    'created_at'       => date('Y-m-d H:i:s')
                ]);

                $gbips = $this->CI->db->where('ip', $request_ip)->order_by('id', 'desc')->get('giving_blacklisted_ips')->row();

                if (!$gbips) {
                    $this->CI->db->insert('giving_blacklisted_ips', [
                        'ip'         => $request_ip,
                        'obj_log'    => $obj_log,
                        'status'     => 1,
                        'created_at' => date('Y-m-d H:i:s')
                    ]);
                } else {
                    $this->CI->db->where('ip', $request_ip)->update('giving_blacklisted_ips', [
                        'obj_log'    => $obj_log,
                        'status'     => 1,
                        'updated_at' => date('Y-m-d H:i:s')
                    ]);
                }

                $response['error']   = 1;
                $response['message'] = 'Please contact your administrator, error 9971';
                return $response;
            }
        }
        return false;
    }

    public function processTwilioRequest() {
        require_once 'application/libraries/messenger/MessengerProvider.php';
        MessengerProvider::init(PROVIDER_MESSENGER_TWILIO);
        $TwilioInstance = MessengerProvider::getInstance();

        log_message("error", "_INFO_LOG processTwilioRequest REQUEST:" . json_encode($_REQUEST));

        if (!isset($_REQUEST['From']) || !isset($_REQUEST['Body']) || !isset($_REQUEST['To'])) {
            echo $TwilioInstance->msgResponse('Bad Request');
            return;
        }

        $from = $_REQUEST['From'];
        $body = $_REQUEST['Body'];
        $to   = $_REQUEST['To'];

        $this->CI->load->model('organization_model');
        $churchObj = $this->CI->organization_model->getWhere('ch_id, client_id, church_name, slug', ['twilio_phoneno' => $to], false, 'ch_id desc');

        $churchObj = $churchObj ? (object) $churchObj[0] : null;

        $churchId = null;
        $user_id  = null;

        if (empty($churchObj)) {
            echo $TwilioInstance->msgResponse('You are not associated with this organization.');
            return;
        } else {

            $churchId = $churchObj->ch_id;
            $user_id  = $churchObj->client_id;

            $this->CI->load->model('orgnx_onboard_psf_model');
            $ornx_onboard_psf = $this->CI->orgnx_onboard_psf_model->getByOrg($churchId, $user_id, ['id', 'account_status']);
            if ($ornx_onboard_psf->account_status && strtolower($ornx_onboard_psf->account_status) != 'enabled') {
                echo $TwilioInstance->msgResponse('This organization is not ready for receiving payments. Please contact an administrator. (Incorrect Account Status)');
                return;
            }
        }

        $accountDonor = $this->CI->db->query("SELECT * FROM account_donor "
                        . "WHERE TRUE "
                        . "AND replace(replace(replace(replace(replace(replace(replace(CONCAT_WS('', '+', phone_code, phone), '-', ''), '(', ''), ')', ''), '.', ''), ' ', ''), '_', ''), ',', '') = ? "
                        . "AND id_church = ? "
                        . "ORDER BY id DESC "
                        . "LIMIT 1", [$from, $churchId])->row();

        if (empty($accountDonor)) {
            $this->CI->load->model('organization_model');
            echo $TwilioInstance->msgResponse('Please create your account at ' . SHORT_BASE_URL . 'org-' . $churchObj->slug . ' and add your phone and a giving method, then you can text GIVE');
            return;
        }

        $str = trim($body);

        $amountValue = (float) filter_var($str, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);

        $hasGive        = strpos(strtolower($str), 'give') !== false;
        $hasAmountValue = $amountValue > 0 ? true : false;
        $hasTo          = strpos(strtolower($str), ' to ') !== false;
        $hasFund        = false;
        $bodyFund       = '';

        if ($hasTo) {
            $toPosition = strpos(strtolower($str), ' to ');
            $bodyFund   = trim(substr($str, $toPosition + 4));
            $hasFund    = strlen($bodyFund) > 0;
        }

        $trx = $this->CI->db->where('mobile_no', $from)
                        ->where('donarid', $accountDonor->id)
                        ->where('church_id', $churchId)
                        ->where('date_time >= NOW() - INTERVAL 10 MINUTE', null, false)
                        ->where('active', 1)
                        ->order_by('date_time', 'desc')->limit(1, 0)
                        ->get(SELF::TABLE_MOBILE_TRX)->row();

        $message = '';

        $currentAmount     = '';
        $currentSourceName = '';
        $currentSourceId   = '';
        $currentGivingType = '';

        $newTransaction = false;

        if (!empty($trx)) {
            $currentAmount     = $trx->amount;
            $currentSourceName = $trx->source_name;
            $currentSourceId   = $trx->sourceid;
            $currentGivingType = $trx->giving_type;
        } else {
            $fundInAdvance = (object) ['id' => ''];
            if ($hasTo) {
                $this->CI->load->model('fund_model');
                $fundInAdvance = $this->CI->fund_model->getWhere('id, name', ['church_id' => $churchId, 'campus_id' => null, 'name' => $bodyFund], 'id desc', true);
                if (!$fundInAdvance) {
                    echo $TwilioInstance->msgResponse('Fund "' . ucfirst(strtolower($bodyFund)) . '" not found, please try again.');
                    return;
                }
            }

            $newTransaction = true;
            $this->CI->db->insert(self::TABLE_MOBILE_TRX, [
                'mobile_no'   => $from,
                'church_id'   => $churchId,
                'donarid'     => $accountDonor->id,
                'amount'      => $amountValue > 0 ? $amountValue : 0,
                'giving_type' => $fundInAdvance->id,
                'source_name' => '',
                'sourceid'    => '',
            ]);

            $trx = $this->CI->db->where('id', $this->CI->db->insert_id())->get(self::TABLE_MOBILE_TRX)->row();
        }

        //var_dump($hasGive, $hasAmountValue, $hasTo,$hasFund); die;
        //If you'd like to give to Church of The Rock, reply with an amount.
        if ($hasGive && !$hasAmountValue && !$hasTo && !$hasFund) {
            $message = 'If you\'d like to give to ' . $churchObj->church_name . ', reply with an amount.';
            // echo "only give\n";
            // echo "echo the how much message\n";
        } else if ($hasGive && $hasAmountValue && !$hasTo && !$hasFund) {
            // echo "only give and amount\n";
            // echo "echo the selection of card or bank\n";
            $this->CI->db->where('id', $trx->id)->update(SELF::TABLE_MOBILE_TRX, [
                'mobile_no' => $from,
                'amount'    => $amountValue,
            ]);

            $message = $this->_twilioGetSourceText($accountDonor->id, $churchObj);
        } else if ($hasGive && $hasAmountValue && $hasTo && $hasFund) {

            $this->CI->db->where('id', $trx->id)->update(SELF::TABLE_MOBILE_TRX, [
                'mobile_no' => $from,
                'amount'    => $amountValue,
            ]);

            $message = $this->_twilioGetSourceText($accountDonor->id, $churchObj);
            // echo "complete text\n";
            // echo "echo the selection of card or bank\n";
        } else if (!$hasGive && $hasAmountValue && !$hasTo && !$hasFund) {
            // echo "only amount\n";
            if ($currentAmount == '' || $currentAmount == 0) {
                // echo "update amount in DB\n";
                // echo "echo selection of card or bank\n";
                $this->_twilioUpdateTrx($trx->id, ['amount' => $amountValue]);
                $message = $this->_twilioGetSourceText($accountDonor->id, $churchObj);
            } else if ($currentSourceName == '') {
                // echo "update source name in DB\n";
                // echo "echo selection of payment source\n";
                $sources = $this->_twilioGetSources($accountDonor->id);

                if (isset($sources[$amountValue - 1])) {
                    $source = $sources[$amountValue - 1];
                    $this->_twilioUpdateTrx($trx->id, ['source_name' => $source->source_type, 'sourceid' => $source->epicpay_wallet_id]);

                    if ($trx->giving_type != '') {
                        $response = $this->_twilioProcessTrx($trx->id);

                        if ($response['error'] == 0) {
                            $message = 'Payment processed!';
                        } else {
                            $message = $response['message'];
                        }
                    } else {

                        $funds = $this->_twilioGetFunds($churchId);

                        if (count($funds) > 0) {
                            $fundsArr = [];
                            foreach ($funds as $fd) {
                                array_push($fundsArr, $fd->name);
                            }

                            $message = "Thank you for your generosity! Which fund would you like to give to? \n";
                            foreach ($fundsArr as $key => $fund) {
                                $message .= ($key + 1) . ") " . $fund . " \n";
                            }
                        } else {
                            $message = 'Payment processed!';
                        }
                    }
                } else {
                    $message = 'Invalid source selection';
                }
            } else if ($currentGivingType == '') {
                // echo "update giving type in DB\n";
                // echo "process payment and echo result\n";
                $funds = $this->_twilioGetFunds($churchId);

                if (count($funds) > 0) {
                    $fundsArr = [];
                    foreach ($funds as $fd) {
                        array_push($fundsArr, $fd->id);
                    }

                    if (isset($fundsArr[$amountValue - 1])) {
                        $this->_twilioUpdateTrx($trx->id, ['giving_type' => $fundsArr[$amountValue - 1]]);
                        $response = $this->_twilioProcessTrx($trx->id);

                        if ($response['error'] == 0) {
                            $message = 'Payment processed!';
                        } else {
                            $message = $response['message'];
                        }
                    } else {
                        $message = 'Invalid fund selection';
                    }
                } else {
                    $message = 'This organization does not have funds';
                }
            }
        } else {
            $message = 'Invalid input. Please try again';
        }

        echo $TwilioInstance->msgResponse($message);
        return;
    }

    private function _twilioGetFunds($churchId) {
        $this->CI->load->model('fund_model');
        $resultObj = true;
        $funds     = $this->CI->fund_model->getListSimple($churchId, null, $resultObj);
        return $funds;
    }

    private function _twilioGetSourceText($accountDonorId, $churchObj) {
        $message = '';
        $sources = $this->_twilioGetSources($accountDonorId);

        if (empty($sources) || count($sources) == 0) {
            $message = 'No payment method found, please add at least one at: ' . SHORT_BASE_URL . 'org-' . $churchObj->slug;
        } else {
            $message = 'Which payment method would you like to use today \n';
            foreach ($sources as $key => $value) {
                $type    = $value->source_type == 'card' ? 'Card ...' : 'Bank account ...';
                $message .= ($key + 1) . ') ' . $type . $value->last_digits . " \n";
            }
        }

        return $message;
    }

    private function _twilioGetSources($accountDonorId) {
        $this->CI->load->model('sources_model');
        $orderBy   = false;
        $resultObj = true;
        return $this->CI->sources_model->getList($accountDonorId, $orderBy, $resultObj, ['id', 'source_type', 'epicpay_wallet_id', 'last_digits']);
    }

    private function _twilioUpdateTrx($trxId, $data) {
        $this->CI->db->where('id', $trxId)->update(self::TABLE_MOBILE_TRX, $data);
    }

    private function _twilioProcessTrx($trxId) {
        $trx      = $this->CI->db->where('id', $trxId)->get(self::TABLE_MOBILE_TRX)->row();
        $accDonor = $this->CI->db->where('id', $trx->donarid)->get('account_donor')->row();
        $church   = $this->CI->db->where('ch_id', $trx->church_id)->get('church_detail')->row();

        $processorCust = $this->CI->db->where('account_donor_id', $trx->donarid)
                        ->where('status', 'P')
                        ->order_by('id', 'desc')
                        ->get(self::TABLE_CUSTOMERS)->row();

        $walletInfo = $this->CI->db->where('customer_id', $processorCust->id)->where('epicpay_wallet_id', $trx->sourceid)
                        ->get(self::TABLE_CUSTOMER_SOURCES)->row();

        $customerData = [
            'church_id'        => $trx->church_id,
            'account_donor_id' => $trx->donarid,
            'customer_address' => [
                'email'       => $accDonor->email,
                'first_name'  => $accDonor->first_name,
                'last_name'   => $accDonor->last_name,
                'postal_code' => '-',
            ],
            'billing_address'  => [
                'email'       => $accDonor->email,
                'first_name'  => $accDonor->first_name,
                'last_name'   => $accDonor->last_name,
                'postal_code' => '',
            ],
        ];

        $trxn_               = new stdClass();
        $trxn_->total_amount = $trx->amount;
        $trxn_->template     = $church->paysafe_template;
        $trxn_->src          = $walletInfo->source_type === "card" ? "CC" : "BNK";
        $fee                 = getPaySafeFee($trxn_);
        $sub_total_amount    = $trx->amount - $fee;

        $transactionData = [
            'customer_id'        => $processorCust->id,
            'customer_source_id' => $walletInfo->id,
            'church_id'          => $trx->church_id,
            'account_donor_id'   => $trx->donarid,
            'total_amount'       => $trx->amount,
            'sub_total_amount'   => $sub_total_amount,
            'fee'                => $fee,
            'first_name'         => $accDonor->first_name,
            'last_name'          => $accDonor->last_name,
            'email'              => $accDonor->email,
            'phone'              => $trx->mobile_no,
            'zip'                => $customerData['customer_address']['postal_code'],
            'giving_source'      => 'sms',
            //'giving_type'         => $trx->giving_type,
            //'epicpay_customer_id' => $processorCust->epicpay_customer_id,
            //'epicpay_wallet_id'   => $processorSource->epicpay_wallet_id,
            'src'                => $trxn_->src,
            'template'           => $church->paysafe_template,
            'is_fee_covered'     => 0
        ];

        $paymentData = [
            'amount'             => (int) ((string) ($trx->amount * 100)), /* --- bcmul should used here we need to install this on servers (aws and ssdnodes) --- */
            'currency'           => 'usd',
            'transaction_type'   => 'Sale',
            'method'             => 'wallet',
            'client_customer_id' => $trx->donarid,
        ];

        $paymentData['wallet'] = [
            'wallet_id'             => $walletInfo->epicpay_wallet_id,
            'postal_code'           => $walletInfo->postal_code,
            'processor_customer_id' => $walletInfo->epicpay_customer_id
        ];

        $paymentData['bank_type'] = $walletInfo->bank_type;

        if ($trxn_->src == 'BNK') {
            $paymentData['sec_code'] = 'WEB';
        }

        if (in_array($trx->church_id, TEST_ORGNX_IDS)) {
            $this->setTesting(true);
        }
        
        $fund_data = [['fund_id' => $trx->giving_type, 'fund_amount' => $transactionData['total_amount']]];

        $fund_data = setMultiFundDistrFeeNotCovered($fund_data, $transactionData);
        
        $response = $this->createTransaction($transactionData, $customerData, $paymentData, $fund_data);

        if ($response['error'] == 1) {
            $response['message'] = 'Sorry your payment was declined, please try again with a different payment source.';
        } else {
            $transactionData["trxId"] = $response["trxId"];
            $this->CI->load->helper('emails');
            sendDonationEmail($transactionData, false, $trx->giving_type);
        }

        $this->CI->db->where('id', $trx->id)->update(self::TABLE_MOBILE_TRX, ['active' => 0]);

        return $response;
    }

}
