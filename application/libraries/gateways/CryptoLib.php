<?php

if (!defined('BASEPATH'))
    exit('No direct script access allowed');

/**
 * PaySafe class to handle all inbound and outbound requests
 *
 */
class CryptoLib {

    const TABLE_CUSTOMERS        = 'epicpay_customers';
    const TABLE_CUSTOMER_WH      = 'paysafe_webhooks';
    const TABLE_CUSTOMER_SOURCES = 'epicpay_customer_sources';
    const TABLE_CUSTOMER_SUBS    = 'epicpay_customer_subscriptions';
    const TABLE_CUSTOMER_TRX     = 'epicpay_customer_transactions';
    const TABLE_CUSTOMER_TRX_TR  = 'epicpay_customer_trx_transfers';
    const TABLE_MOBILE_TRX       = 'mobile_transaction';
    const URL                    = 'https://crytpo-api.com/v1/'; //alexey
    const URL_TEST               = 'https://test.crytpo-api.com/v1/'; 

    private $encryptPhrase;
    private $userName;
    private $userPass;
    private $testing               = false;
    private $logSensibleData       = FALSE; // WARNING PUT IT TO FALSE ON PRD/LIVE ENVIRONMENT
    private $paysafe_product_codes = [];
    public $paysafe_environment    = null;
    private $mainUserId            = null;

    function __construct() {
        //alexey | configure here constants, api keys, etc ...
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
    
    /* --- --- Platform Crypto Account Management --- --- */

    public function create_wallet($data) {

        $response = $this->_makeCurlRequest('wallet/create', $data['payload'], 'post');
        return $response;
    }

    public function setMainUserId($userId) {
        $this->mainUserId = $userId;
    }

    public function setTesting($value) {
        if ($value) {

            $this->paysafe_product_codes = PAYSAFE_PRODUCT_CODES_TEST;

            $this->userName = 'user-123-test';
            $this->userPass = 'pass-123-test';
        } else {

            $this->paysafe_product_codes = PAYSAFE_PRODUCT_CODES_LIVE;

            $this->userName = 'user-123-live';
            $this->userPass = 'pass-123-live';
        }
        $this->testing = $value;
    }

    public function getTesting() {
        return $this->testing;
    }

    public function createTransaction($transactionData, $customerData, $paymentData, $fund_data, $productsWithRequest = null) {

        //alexey         
        //the requestbody is what we send externally, transaction_data is what we keep and save in our database

        $requestBody                          = [];
        
        //verifyx alexey later we will be defining the currency, we need to save the amount in a different column of the database it could be amount_eth
        $requestBody['amount']                = $paymentData['amount'];
        $requestBody['eth']                   = [
            'paymentToken' => $paymentData['eth']['single_use_token']
        ];
        $requestBody['billingDetails']['zip'] = $customerData['paysafe_billing_address']['zip'];

        if (isset($customerData['customer']['id'])) {
            $requestBody['client_customer_id'] = $customerData['customer']['id'];
        }

        $transactionData['request_data']                   = $requestBody;
        $transactionData['created_at']                     = date('Y-m-d H:i:s');
        $transactionData['request_data']['merchantRefNum'] = $this->SYSTEM_LETTER_ID . '-check-paysafeRef';

        $endPoint = 'eth-endpoint/pay';

        $transactionData['request_data']['_endPoint'] = $endPoint;
        $transactionData['request_data']              = json_encode($transactionData['request_data']);
        $transactionData["from_domain"]               = base_url();
        $transactionData['donor_ip']                  = get_client_ip_from_trusted_proxy();

        $this->CI->db->insert(self::TABLE_CUSTOMER_TRX, $transactionData);
        $trxId = $this->CI->db->insert_id();

        // --- When payment link request: products must be saved as a log of the payment, products quantities and prices are variable but the payment 
        // --- must be saved as a snapshot
        // --- this code is also written on paysafelib we should reuse it by centralizing it somewhere | verifyx | rector it => let's do it later
        if (isset($transactionData['payment_link_id']) && $transactionData['payment_link_id']) {
            $this->CI->load->model('payment_link_product_paid_model');

            foreach ($productsWithRequest as $row) {
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

        $this->CI->load->model('transaction_fund_model', 'trnx_funds');

        //validating create customer_subscription_id when transaction comes text to give
        $customer_subscription_id = isset($transactionData['customer_subscription_id']) && $transactionData['customer_subscription_id'] ? $transactionData['customer_subscription_id'] : null;

        foreach ($fund_data as $row) {
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

            $this->CI->donor_model->updateDonationAcum($donationAcumData);

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

    public function createSubscription($transactionData, $customerData, $paymentData, $fund_data) {

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
            'ispaysafe'               => 1
                //'request_data'       => $transactionData['request_data']
        ];

        $subscriptionData['created_at'] = date('Y-m-d H:i:s');
        $this->CI->db->insert(self::TABLE_CUSTOMER_SUBS, $subscriptionData);
        $subId                          = $this->CI->db->insert_id();

        $this->CI->load->model('transaction_fund_model', 'trnx_funds');

        foreach ($fund_data as $row) {
            $trnxFundData = [
                'subscription_id' => $subId,
                'fund_id'         => $row['fund_id'],
                'amount'          => $row['_fund_amount'],
                'fee'             => $row['_fund_fee'],
                'net'             => $row['_fund_sub_total_amount']
            ];

            $this->CI->trnx_funds->register($trnxFundData);
        }

        $response['error'] = 0;

        return $response;
    }

    //========== creates a new customer with a source, if the customer exists it adds the source only
    public function createCustomer($customerData, $paymentData) {

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


        $requestBody                  = [
            //'amount'           => $transaction->total_amount * 100,
            'merchantRefNum' => $trxnResponse->response->merchantRefNum,
        ];
        $refundData['refund_request'] = json_encode($requestBody);
        $response                     = $this->_makeCurlRequest('eth-endpoint/refund', $requestBody, 'post');

        $refundData['refund_response'] = json_encode($response);

        //////////////////////////////////////////

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

    private function _makeCurlRequest($path, $body = null, $method = 'post', $getFormat = null) {

        //alexey configure curl stuff here, we need a test and production environment
        $url       = $this->testing ? self::URL_TEST . $path : self::URL . $path;
        
        //a success account creation:
        return ['error' => 0, 'response' => ['status' => true,'message' => 'Crypto wallet created', 'example_data' => ['endpoint' => $url, 'body' => $body]]];
        
        print_r('crytpo curl process | url endpoint: ' . $url . ' | body: ' . json_encode($body));
                               
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

        if ($this->testing) {
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

        $data = curl_exec($ch);

        if ($this->testing) {
            $this->CI->db->insert('request_logs', ['object' => $data, 'type' => 'response', 'date' => date('Y-m-d H:i:s')]);
        }

        if (curl_errno($ch)) {
            $error_msg = curl_error($ch);
            curl_close($ch);
            return ['error' => 1, 'response' => $error_msg . ' | Try again'];
        } else {
            curl_close($ch);
            $response = json_decode($data);
            if (is_string($response)) {
                return ['error' => 1, 'response' => $response];
            }

            return ['error' => 0, 'response' => $response];
        }
    }

}
