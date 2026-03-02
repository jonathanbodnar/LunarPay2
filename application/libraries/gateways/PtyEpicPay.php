<?php

if (!defined('BASEPATH'))
    exit('No direct script access allowed');

/**
 * Epicpay class to handle all inbound and outbound requests.
 *
 *
 * @category   Library
 * @package    EpicPay
 * @version    1.0.0
 */
class PtyEpicPay {

    const TABLE_CUSTOMERS        = 'epicpay_customers';
    const TABLE_CUSTOMER_WH      = 'epicpay_webhooks';
    const TABLE_CUSTOMER_SOURCES = 'epicpay_customer_sources';
    const TABLE_CUSTOMER_SUBS    = 'epicpay_customer_subscriptions';
    const TABLE_CUSTOMER_TRX     = 'epicpay_customer_transactions';
    const TABLE_CUSTOMER_TRX_TR  = 'epicpay_customer_trx_transfers';
    const TABLE_MOBILE_TRX       = 'mobile_transaction';
    const URL                    = 'https://api.epicpay.com/';
    const URL_TEST               = 'https://sandbox-api.epicpay.com/';
    const URL_RPT                = 'https://rpt-api.epicpay.com/';
    const URL_RPT_TEST           = 'https://sandbox-api.epicpay.com/';

    private $encryptPhrase;
    private $userName;
    private $userPass;
    private $agentCredentials;
    private $testing     = false;
    private $use_url_rpt = false;

    function __construct() {
        $this->CI = & get_instance();

        $this->CI->load->helper('epicpay');

        $this->encryptPhrase = $this->CI->config->item('pty_epicpay_encrypt_phrase');

        $this->userName = $this->CI->config->item('pty_epicpay_api_username');
        $this->userPass = $this->CI->config->item('pty_epicpay_api_password');
        $this->testing  = $this->CI->config->item('pty_epicpay_testing');


        $this->CI->load->library('encryption');

        $this->CI->encryption->initialize([
            'cipher' => 'aes-256',
            'mode'   => 'ctr',
            'key'    => $this->encryptPhrase,
                ]
        );
    }

    public function setTesting($value) {
        if ($value !== true && $value != false) {
            die("error setting ep test mode");
        }
        $this->testing = $value;
    }

    public function setAgentCredentials($agentCredentials) {
        $this->agentCredentials = $agentCredentials;
    }

    /*     * **************************************************************************
     *
     * Create agent
     *
     * @param    array     $agentData holds data of the agent
     * @return   array     [error, message]
     *
     *
     * *************************************************************************** */

    public function createAgent($agentData) {

        $requestBody = [
            'client_app_id'         => $agentData['church_id'],
            'email'                 => $agentData['email'],
            'dba_name'              => $agentData['church_name'],
            'location'              => ['phone_number' => $agentData['phone_number']],
            'primary_principal'     => ['first_name' => $agentData['first_name'], 'last_name' => $agentData['last_name']],
            'application_type'      => 'both',
            'template_id'           => $this->testing ? 'Epic25' : ($agentData["epicpay_template"] ? $agentData["epicpay_template"] : EPICPAY_TPL_DEFAULT),
            'app_delivery'          => 'link_iframe',
            'app_complete_endpoint' => base_url() . 'epicpay/merchant_appcomplete/' . $agentData['church_id'],
        ];

        $response = $this->_makeCurlRequest('agent/v1/', 'BoardMerchant', $requestBody);

        if ($response['error'] == 1 || ($response['error'] == 0 && $response['response']->status->response_code != 'Received')) {

            $response['error']   = 1;
            $response['message'] = $response['response']->status->reason_text;

            return $response;
        }

        $this->CI->db->where('ch_id', $agentData['church_id'])
                ->update("church_detail", ["epicpay_template" => $requestBody["template_id"]]);

        return $response;
    }

    //=============
    public function onboardMerchant($requestBody) {
        $resp = $this->_makeCurlRequest('agent/v1/', 'BoardMerchant', $requestBody);

        if (isset($resp['response']->status->response_code) && $resp['response']->status->response_code == 'Received') {
            return ['status' => true, 'result' => $resp['response']->result];
        } else {
            return ['status' => false, 'message' => $resp['response']->status->reason_text];
        }
    }

    //=============

    /*     * **************************************************************************
     *
     * Create customer
     *
     * @param    array     $customerData holds data of the customer
     * @param    array     $paymentData holds data of the payment source
     * @return   array     [error, message]
     *
     *
     * *************************************************************************** */

    public function createCustomer($customerData, $paymentData) {

        if (!isset($customerData['customer_address'])) {
            return ['error' => 1, 'message' => 'The customer address is required'];
        }

        $customerExists = false;
        $dbCustomer     = null;

        if ($customerData['account_donor_id'] > 0) {
            $dbCustomer = $this->CI->db->where('account_donor_id', $customerData['account_donor_id'])
                            ->where('church_id', $customerData['church_id'])
                            ->where('status', 'P')
                            ->order_by('id', 'desc')
                            ->get(self::TABLE_CUSTOMERS)->row();

            if ($dbCustomer) {
                $customerExists = true;
            }
        }

        if (!$customerExists) {
            $requestBody = [
                'method'           => $paymentData['method'],
                'customer_address' => $customerData['customer_address'],
                'billing_address'  => $customerData['customer_address'],
            ];

            $paymentMethodLastDigits = null;

            if ($paymentData['method'] == 'credit_card') {
                $requestBody['credit_card'] = $paymentData['credit_card'];
                $paymentMethodLastDigits    = substr($requestBody['credit_card']['card_number'], -4);
            } else if ($paymentData['method'] == 'echeck') {
                $requestBody['sec_code']     = isset($paymentData['sec_code']) && $paymentData['sec_code'] ? $paymentData['sec_code'] : 'WEB';
                $requestBody['bank_account'] = $paymentData['bank_account'];
                $paymentMethodLastDigits     = substr($requestBody['bank_account']['account_number'], -4);
            }

            $requestBody2 = $requestBody;

            // Protect credit card or bank information
            unset($requestBody2['credit_card']);
            unset($requestBody2['bank_account']);

            $requestBody2 = json_encode($requestBody2);

            $created_at = date('Y-m-d H:i:s');

            $this->CI->db->insert(self::TABLE_CUSTOMERS, [
                'email'            => $customerData['customer_address']['email'],
                'first_name'       => $customerData['customer_address']['first_name'],
                'last_name'        => $customerData['customer_address']['last_name'],
                'church_id'        => $customerData['church_id'],
                'account_donor_id' => $customerData['account_donor_id'],
                'request_data'     => $requestBody2,
                'created_at'       => $created_at,
            ]);

            $customerId = $this->CI->db->insert_id();

            $requestBody['client_customer_id'] = $customerId . '-' . date('YmdHis', strtotime($created_at));

            $response = $this->_makeCurlRequest('payment/v1/', 'AddWalletItem', $requestBody);

            if ($response['error'] == 1 || ($response['error'] == 0 && $response['response']->status->response_code != 'Received')) {
                $response['error'] = 1;

                $this->CI->db->where('id', $customerId)->update(self::TABLE_CUSTOMERS, [
                    'request_response' => json_encode($response),
                    'status'           => 'E',
                    'updated_at'       => date('Y-m-d H:i:s'),
                ]);

                if (isset($response['response']->status->reason_text))
                    $response['message'] = $response['response']->status->reason_text;

                return $response;
            }

            $this->CI->db->where('id', $customerId)->update(self::TABLE_CUSTOMERS, [
                'epicpay_customer_id' => $response['response']->result->wallet->customer_id,
                'request_response'    => json_encode($response),
                'status'              => 'P',
                'updated_at'          => date('Y-m-d H:i:s'),
            ]);

            $nameHolder = $paymentData['method'] == 'credit_card' ? $paymentData['credit_card']['card_holder_name'] : $paymentData['bank_account']['account_holder_name'];

            $this->CI->db->insert(self::TABLE_CUSTOMER_SOURCES, [
                'customer_id'         => $customerId,
                'church_id'           => $customerData['church_id'],
                'account_donor_id'    => $customerData['account_donor_id'],
                'source_type'         => $paymentData['method'] == 'credit_card' ? 'card' : 'bank',
                'last_digits'         => $paymentMethodLastDigits,
                'name_holder'         => $nameHolder,
                'epicpay_wallet_id'   => $response['response']->result->wallet->wallet_id,
                'epicpay_customer_id' => $response['response']->result->wallet->customer_id,
                'is_active'           => 'Y',
                'is_saved'            => $customerData['is_saved'],
                'status'              => 'P',
                'exp_month'           => isset($paymentData['credit_card']['exp_month']) && $paymentData['credit_card']['exp_month'] ? $paymentData['credit_card']['exp_month'] : null,
                'exp_year'            => isset($paymentData['credit_card']['exp_year']) && $paymentData['credit_card']['exp_year'] ? $paymentData['credit_card']['exp_year'] : null,
                'postal_code'         => $customerData['customer_address']['postal_code'],
                'request_data'        => 'check-customer',
                'created_at'          => date('Y-m-d H:i:s'),
            ]);

            $customerSourceId     = $this->CI->db->insert_id();
            $response['customer'] = ['id' => $customerId, 'epicpay_id' => $response['response']->result->wallet->customer_id];
            $response['source']   = ['id' => $customerSourceId, 'epicpay_id' => $response['response']->result->wallet->wallet_id];

            return $response;
            // END NEW CUSTOMER
        }
        else {
            if ($customerData['is_saved'] == 'Y') {
                $requestBody = [
                    'customer_id' => $dbCustomer->epicpay_customer_id,
                    'method'      => $paymentData['method']
                ];

                $paymentMethodLastDigits = null;

                if ($paymentData['method'] == 'credit_card') {
                    $requestBody['credit_card'] = $paymentData['credit_card'];
                    $paymentMethodLastDigits    = substr($requestBody['credit_card']['card_number'], -4);
                } else if ($paymentData['method'] == 'echeck') {
                    $requestBody['sec_code']     = isset($paymentData['sec_code']) && $paymentData['sec_code'] ? $paymentData['sec_code'] : 'WEB';
                    $requestBody['bank_account'] = $paymentData['bank_account'];
                    $paymentMethodLastDigits     = substr($requestBody['bank_account']['account_number'], -4);
                }

                $requestBody2 = $requestBody;

                // Protect credit card or bank information
                unset($requestBody2['credit_card']);
                unset($requestBody2['bank_account']);
                $requestBody2 ['last_digits'] = $paymentMethodLastDigits;
                $requestBody2                 = json_encode($requestBody2);

                $nameHolder = $paymentData['method'] == 'credit_card' ? $paymentData['credit_card']['card_holder_name'] : $paymentData['bank_account']['account_holder_name'];

                $this->CI->db->insert(self::TABLE_CUSTOMER_SOURCES, [
                    'customer_id'      => $dbCustomer->id,
                    'church_id'        => $customerData['church_id'],
                    'account_donor_id' => $customerData['account_donor_id'],
                    'source_type'      => $paymentData['method'] == 'credit_card' ? 'card' : 'bank',
                    'last_digits'      => $paymentMethodLastDigits,
                    'name_holder'      => $nameHolder,
                    'is_active'        => 'Y',
                    'is_saved'         => $customerData['is_saved'],
                    'request_data'     => $requestBody2,
                    'exp_month'        => isset($paymentData['credit_card']['exp_month']) && $paymentData['credit_card']['exp_month'] ? $paymentData['credit_card']['exp_month'] : null,
                    'exp_year'         => isset($paymentData['credit_card']['exp_year']) && $paymentData['credit_card']['exp_year'] ? $paymentData['credit_card']['exp_year'] : null,
                    'postal_code'      => $customerData['customer_address']['postal_code'],
                    'created_at'       => date('Y-m-d H:i:s'),
                ]);

                $customerSourceId = $this->CI->db->insert_id();

                $response = $this->_makeCurlRequest('payment/v1/', 'AddWalletItem', $requestBody);

                if ($response['error'] == 1 || ($response['error'] == 0 && $response['response']->status->response_code != 'Received')) {

                    $response['error'] = 1;
                    $this->CI->db->where('id', $customerSourceId)->update(self::TABLE_CUSTOMER_SOURCES, [
                        'request_response' => json_encode($response),
                        'status'           => 'E',
                        'updated_at'       => date('Y-m-d H:i:s'),
                    ]);

                    $response['message'] = $response['response']->status->reason_text;

                    return $response;
                }

                $this->CI->db->where('id', $customerSourceId)->update(self::TABLE_CUSTOMER_SOURCES, [
                    'epicpay_wallet_id'   => $response['response']->result->wallet->wallet_id,
                    'epicpay_customer_id' => $dbCustomer->epicpay_customer_id,
                    'request_response'    => json_encode($response),
                    'status'              => 'P',
                    'updated_at'          => date('Y-m-d H:i:s'),
                ]);

                $response['customer'] = ['id' => $dbCustomer->id, 'epicpay_id' => $dbCustomer->epicpay_customer_id];
                $response['source']   = ['id' => $customerSourceId, 'epicpay_id' => $response['response']->result->wallet->wallet_id];

                return $response;
            }

            return ['error' => 0];

            // END USING EXISTING CUSTOMER
        }
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

    public function createSubscription($transactionData, $customerData, $paymentData, $fund_id) {
        
        $requestBody['amount']            = $paymentData['amount'];
        $requestBody['currency']          = $paymentData['currency'];
        $requestBody['method']            = $paymentData['method'];
        $requestBody['next_payment_date'] = $paymentData['next_payment_date'];
        $requestBody['frequency']         = $paymentData['frequency'];
        $requestBody['period']            = $paymentData['period'];
        $requestBody['customer_address']  = $customerData['customer_address'];
        $requestBody['billing_address']   = $customerData['customer_address'];
        $paymentMethodLastDigits          = null;

        //d(json_encode($transactionData), false);        echo "<br>----<br>";        d(json_encode($customerData), false);        echo "<br>----<br>";        d(json_encode($paymentData));

        if ($paymentData['method'] == 'credit_card') {
            $requestBody['credit_card'] = $paymentData['credit_card'];
            $paymentMethodLastDigits    = substr($requestBody['credit_card']['card_number'], -4);
        } else if ($paymentData['method'] == 'wallet') {
            $requestBody['wallet'] = $paymentData['wallet'];
        } else {
            $requestBody['sec_code']     = $paymentData['sec_code'];
            $requestBody['bank_account'] = $paymentData['bank_account'];
            $paymentMethodLastDigits     = substr($requestBody['bank_account']['account_number'], -4);
        }

        $transactionData['request_data'] = $requestBody;
        // Protect credit card or bank information
        unset($transactionData['request_data']['credit_card']);
        unset($transactionData['request_data']['bank_account']);
        $transactionData['request_data'] = json_encode($transactionData['request_data']);

        // Create subscription
        $subscriptionData = [
            'customer_id'        => $transactionData['customer_id'],
            'customer_source_id' => $transactionData['customer_source_id'],
            'church_id'          => $transactionData['church_id'],
            'campus_id'          => $transactionData['campus_id'],
            'frequency'          => $paymentData['cb_frequency'],
            'start_on'           => $paymentData['next_payment_date'],
            'amount'             => $transactionData['total_amount'],
            'account_donor_id'   => $transactionData['account_donor_id'],
            'first_name'         => $transactionData['first_name'],
            'last_name'          => $transactionData['last_name'],
            'email'              => $transactionData['email'],
            'zip'                => $transactionData['zip'],
            'giving_source'      => $transactionData['giving_source'],
            //'giving_type'        => $transactionData['giving_type'],
            'epicpay_template'   => $transactionData['template'],
            'src'                => $transactionData['src'],
            'is_fee_covered'     => $transactionData['is_fee_covered'],
            //'multi_transaction_data' => $transactionData['multi_transaction_data'],            
            'tags'               => isset($transactionData['tags']) ? $transactionData['tags'] : null,
            'campaign_id'        => $transactionData['campaign_id'],
            'request_data'       => $transactionData['request_data']
        ];

        $subscriptionData['created_at'] = date('Y-m-d H:i:s');
        $this->CI->db->insert(self::TABLE_CUSTOMER_SUBS, $subscriptionData);
        $subId                          = $this->CI->db->insert_id();

        $this->CI->load->model('transaction_fund_model', 'trnx_funds');
        $trnxFundData = [
            'subscription_id' => $subId,
            'fund_id'         => $fund_id,
            'amount'          => $transactionData['total_amount'],
            'fee'             => $transactionData['fee'],
            'net'             => $transactionData['sub_total_amount']
        ];

        $this->CI->trnx_funds->register($trnxFundData);

        // Make the epic pay request               
        $response = $this->_makeCurlRequest('payment/v1/', 'addsubscription', $requestBody);

        if ($response['response']->status->response_code == 'Received') {
            $response['error'] = 0;
            $updateData        = [
                'epicpay_customer_id'     => $response['response']->result->subscription->customer_id,
                'epicpay_wallet_id'       => $response['response']->result->subscription->wallet_id,
                'epicpay_subscription_id' => $response['response']->result->subscription->subscription_id,
                'request_response'        => json_encode($response),
                'updated_at'              => date('Y-m-d H:i:s'),
                'status'                  => 'A'
            ];
        } else {
            $response['error'] = 1;
            $updateData        = [
                'request_response' => json_encode($response),
                'updated_at'       => date('Y-m-d H:i:s'),
                'status'           => 'N'
            ];

            $response['message'] = isset($response['response']->status->reason_text) ? $response['response']->status->reason_text : 'Unknown error. Please contact your administrator';
        }

        $this->CI->db->update(self::TABLE_CUSTOMER_SUBS, $updateData, ['id' => $subId]);

        return $response;
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

    /*     * **************************************************************************
     *
     * Create transaction
     *
     * @param    array     $transactionData holds data of the transaction
     * @param    array     $customerData holds data of the customer
     * @param    array     $paymentData holds data of the payment source
     * @return   array     [error, message]
     *
     *
     * *************************************************************************** */

    public function createTransaction($transactionData, $customerData, $paymentData, $fund_id) {

        $requestBody['amount']           = $paymentData['amount'];
        $requestBody['currency']         = $paymentData['currency'];
        $requestBody['method']           = $paymentData['method'];
        $requestBody['transaction_type'] = 'Sale';
        $requestBody['customer_address'] = $customerData['customer_address'];
        $requestBody['billing_address']  = $customerData['customer_address'];
        $paymentMethodLastDigits         = null;

        if ($paymentData['method'] == 'credit_card') {
            $requestBody['credit_card'] = $paymentData['credit_card'];
            $paymentMethodLastDigits    = substr($requestBody['credit_card']['card_number'], -4);
        } else if ($paymentData['method'] == 'wallet') {
            $requestBody['wallet'] = $paymentData['wallet'];
            if ($transactionData["src"] == "BNK") {
                $requestBody['sec_code'] = $paymentData['sec_code'];
            }
        } else if ($paymentData['method'] == 'echeck') {
            $requestBody['sec_code']     = $paymentData['sec_code'];
            $requestBody['bank_account'] = $paymentData['bank_account'];
            $paymentMethodLastDigits     = substr($requestBody['bank_account']['account_number'], -4);
        }

        if (isset($customerData['customer']['id'])) {
            $requestBody['client_customer_id'] = $customerData['customer']['id'];
        }

        $transactionData['request_data'] = $requestBody;
        $transactionData['created_at']   = date('Y-m-d H:i:s');

        // Protect credit card or bank information
        unset($transactionData['request_data']['credit_card']);
        unset($transactionData['request_data']['bank_account']);
        $transactionData['request_data']['last_digits'] = $paymentMethodLastDigits;
        $transactionData['request_data']                = json_encode($transactionData['request_data']);

        $transactionData["from_domain"] = base_url();

        if ($transactionData["src"] == "BNK") {
            $transactionData["status_ach"] = "W";
        }

        $transactionData['donor_ip'] = get_client_ip_from_trusted_proxy();


        $cIpResponse = $this->ipIsBlackListed($transactionData['donor_ip']);
        if ($cIpResponse !== false) {
            return $cIpResponse;
        }

        $cTestResponse = $this->checkCardTesting($transactionData);
        if ($cTestResponse !== false) {
            return $cTestResponse;
        }

        $this->CI->db->insert(self::TABLE_CUSTOMER_TRX, $transactionData);
        $trxId = $this->CI->db->insert_id();

        $this->CI->load->model('transaction_fund_model', 'trnx_funds');
        $trnxFundData = [
            'transaction_id' => $trxId,
            'fund_id'        => $fund_id,
            'amount'         => $transactionData['total_amount'],
            'fee'            => $transactionData['fee'],
            'net'            => $transactionData['sub_total_amount']
        ];

        $this->CI->trnx_funds->register($trnxFundData);

        $requestBody['client_transaction_id'] = $trxId . '-' . date('YmdHis', strtotime($transactionData['created_at']));

        $response          = $this->_makeCurlRequest('payment/v1/', 'authorize', $requestBody);
        $response["trxId"] = $trxId;

        if ($response['response']->status->response_code == 'Approved' || $response['response']->status->response_code == 'Received') {

            // Remove credit card or bank account information
            unset($response['response']->result->payment->credit_card);
            unset($response['response']->result->payment->bank_account);

            $updateData = [
                'request_response'       => json_encode($response),
                'epicpay_transaction_id' => isset($response['response']->result->payment->transaction_id) ? $response['response']->result->payment->transaction_id : null,
                'updated_at'             => date('Y-m-d H:i:s'),
                'status'                 => 'P'
            ];

            $response['error'] = 0;

            if ($transactionData["src"] != 'BNK') {
                $this->CI->load->model('donor_model');
                $donationAcumData = [
                    'id'          => $transactionData['account_donor_id'],
                    'amount_acum' => $transactionData['total_amount'],
                    'fee_acum'    => $transactionData['fee'],
                    'net_acum'    => $transactionData['sub_total_amount']
                ];
                $this->CI->donor_model->updateDonationAcum($donationAcumData);
            }
        } else {
            $updateData = [
                'request_response' => json_encode($response),
                'updated_at'       => date('Y-m-d H:i:s'),
                'status'           => 'N'
            ];

            $response['error']   = 1;
            $response['message'] = isset($response['response']->status->reason_text) ? $response['response']->status->reason_text : 'Unknown error. Please contact your administrator';
        }

        $this->CI->db->update(self::TABLE_CUSTOMER_TRX, $updateData, ['id' => $trxId]);

        return $response;
    }

    public function createCustomerSource($customerData, $paymentData) {
        
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
        $source = $this->CI->sources_model->getOne($donor_id, $source_id, ['id', 'church_id', 'epicpay_wallet_id'], true);

        if (!$source || $source->epicpay_wallet_id == null || strlen($source->epicpay_wallet_id) == 0) {
            return ['error' => 1, 'message' => 'Invalid Id'];
        }

        $church = $this->CI->db->where('ch_id', $source->church_id)->get('church_detail')->row();

        if (empty($church) || $church->epicpay_credentials == null || $church->epicpay_verification_status != 'V') {
            return ['error' => 1, 'message' => 'The setup for this church has not been completed'];
        }

        if (in_array($source->church_id, TEST_ORGNX_IDS)) {
            $this->setTesting(true);
        }

        $this->setAgentCredentials($church->epicpay_credentials);

        $response                      = $this->_makeCurlRequest('payment/v1/', 'DeleteWalletItem/' . $source->epicpay_wallet_id);
        $updateData['response_delete'] = json_encode($response);

        if ($response['response']->status->response_code == 'Received') {
            $updateData['updated_at'] = date('Y-m-d H:i:s');
            $updateData['status']     = 'D';
            $updateData['is_active']  = 'N';

            $response['error'] = 0;
        } else {
            $response['error']   = 1;
            $response['message'] = isset($response['response']->status->reason_text) ? $response['response']->status->reason_text : 'Unknown error. Please contact your administrator';

            return $response;
        }

        /* --- UPDATE ALL DUPLICATED WALLETS --- */
        $this->CI->db
                ->where('church_id', $source->church_id)
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


        if (!$subscription || $subscription->epicpay_subscription_id == null || strlen($subscription->epicpay_subscription_id) == 0) {
            return ['error' => 1, 'message' => 'Invalid Id'];
        }

        if ($subscription->status == 'D') {
            return ['error' => 1, 'message' => 'Subscription already canceled'];
        }

        if (in_array($subscription->church_id, TEST_ORGNX_IDS)) {
            $this->setTesting(true);
        }


        $church = $this->CI->db->where('ch_id', $subscription->church_id)->get('church_detail')->row();

        if (empty($church) || $church->epicpay_credentials == null || $church->epicpay_verification_status != 'V') {
            return ['error' => 1, 'message' => 'The setup for this church has not been completed'];
        }

        $this->setAgentCredentials($church->epicpay_credentials);

        $updateData['stopsub_request']  = json_encode(['_subscription_id' => $subscription->epicpay_subscription_id]);
        $response                       = $this->_makeCurlRequest('payment/v1/', 'Subscription/Suspend/' . $subscription->epicpay_subscription_id);
        $updateData['stopsub_response'] = json_encode($response);

        if ($response['response']->status->response_code == 'Received') {
            $updateData['updated_at']   = date('Y-m-d H:i:s');
            $updateData['cancelled_at'] = date('Y-m-d H:i:s');
            $updateData['status']       = 'D';
            $response['error']          = 0;
        } else {
            $response['message'] = isset($response['response']->status->reason_text) ? $response['response']->status->reason_text : 'Unknown error. Please contact your administrator';
            $response['error']   = 1;
        }


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

        if ($transaction->epicpay_transaction_id == null || strlen($transaction->epicpay_transaction_id) == 0) {
            return ['error' => 1, 'message' => 'The current transaction cannot be refunded. Please contact your administrator'];
        }

        $church = $this->CI->db->where('ch_id', $transaction->church_id)->get('church_detail')->row();

        if (empty($church) || $church->epicpay_credentials == null || $church->epicpay_verification_status != 'V') {
            return ['error' => 1, 'message' => 'The setup for this church has not been completed'];
        }

        if ($transaction->status == 'R') {
            return ['error' => 1, 'message' => 'Transaction already refunded'];
        }

        if ($transaction->status_ach == 'W') {
            return ['error' => 1, 'message' => 'In progress ACH Transactions can\' be refunded'];
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


        $requestBody = [
            'amount'           => $transaction->total_amount * 100,
            'transaction_type' => 'void',
        ];

        $refundData['refund_request'] = json_encode($requestBody);

        $this->setAgentCredentials($church->epicpay_credentials);

        $response = $this->_makeCurlRequest('payment/v1/', 'authorize/' . $transaction->epicpay_transaction_id, $requestBody);

        if ($response['error'] == 1) {
            return ['error' => 1, 'message' => $response['response']];
        }

        $refundData['refund_response'] = json_encode($response);

        if ($response['response']->status->response_code == 'Error' && $response['response']->status->reason_code == 'E18') {
            /* --- IF ERROR = E18 THE TRANSACTION PROBABLY WAS SETTLED, TRY THE REFUND AGAIN WITH TRNX TYPE = CREDIT --- */
            $requestBody                  = [
                'amount'           => $transaction->total_amount * 100,
                'transaction_type' => 'credit',
            ];
            $refundData['refund_request'] .= json_encode($requestBody);

            $response                      = $this->_makeCurlRequest('payment/v1/', 'authorize/' . $transaction->epicpay_transaction_id, $requestBody);
            $refundData['refund_response'] .= json_encode($response);
        }

        if ($response['response']->status->response_code == 'Received') {
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
        } else {
            $response['error']   = 1;
            $response['message'] = isset($response['response']->status->reason_text) ? $response['response']->status->reason_text : 'Unknown error. Please contact your administrator';
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
            $this->CI->db->where('id', $trxId)->update(self::TABLE_CUSTOMER_TRX, ['trx_ret_id' => $refund_trx_id]);
        }

        return $response;
    }

    /*     * **************************************************************************
     *
     * Deposits Report (Payouts)
     *
     * @param    int     $church_id holds the id of the church
     * @param    array   $requestBody holds the start and end date of the report  
     * @return   array   [error, message]
     *
     *
     * *************************************************************************** */

    public function depositsReport($church_id, $requestBody) {

        $church = $this->CI->db->where('ch_id', $church_id)->get('church_detail')->row();

        if (!$church->epicpay_credentials) {
            $result['error']        = 1;
            $result['error_detail'] = "epicpay_credentials_missing";
            $result["message"]      = "The church is not connected to a payment processor";
            return $result;
        }

        $this->setAgentCredentials($church->epicpay_credentials);

        $this->use_url_rpt = true;
        $response          = $this->_makeCurlRequest('reporting/v1/', 'GetReport/deposits', $requestBody);

        $result = [];
        if ($response['response']->status->response_code == 'Received') {
            $result['error']  = 0;
            $result["result"] = $response['response']->result;
        } else {
            $result['error']   = 1;
            $result['message'] = isset($response['response']->status->reason_text) ? $response['response']->status->reason_text : 'Unknown error. Please contact your administrator';
        }

        return $result;
    }

    /*     * **************************************************************************
     *
     * Deposits Detail Report (Payouts)
     *
     * @param    int     $church_id holds the id of the church
     * @param    array   $requestBody holds the start and end date of the report  
     * @return   array   [error, message]
     *
     *
     * *************************************************************************** */

    public function depositsDetailReport($church_id, $requestBody) {

        $church = $this->CI->db->where('ch_id', $church_id)->get('church_detail')->row();

        $data = [];

        if (!$church->epicpay_credentials || $church_id == 5) { //payouts for sandbox accounts don't work okay
            $result['error']  = 0;
            $result["result"] = (object) ['data' => $data];
        }

        $this->setAgentCredentials($church->epicpay_credentials);

        $this->use_url_rpt = true;
        $response          = $this->_makeCurlRequest('reporting/v1/', 'GetReport/deposits-detail', $requestBody);

        if (isset($response['response']->status->response_code) && $response['response']->status->response_code == 'Received') {
            $result['error']  = 0;
            $result["result"] = $response['response']->result;
        } else {
            $result['error']  = 0;
            $result["result"] = (object) ['data' => $data];
        }

        return $result;
    }

    /*     * **************************************************************************
     *
     * Subscriptions Report (Payouts)
     *
     * @param    int     $church_id holds the id of the church
     * @param    array   $requestBody holds the start and end date of the report  
     * @return   array   [error, message]
     *
     *
     * *************************************************************************** */

    public function subscriptionsReport($church_id, $requestBody) {

        $church = $this->CI->db->where('ch_id', $church_id)->get('church_detail')->row();

        if (!$church->epicpay_credentials) {
            $result['error']        = 1;
            $result['error_detail'] = "epicpay_credentials_missing";
            $result["message"]      = "The church is not connected to a payment processor";
            return $result;
        }

        $this->setAgentCredentials($church->epicpay_credentials);

        $this->use_url_rpt = true;
        $response          = $this->_makeCurlRequest('reporting/v1/', 'GetReport/activesubscriptions', $requestBody);

        $result = [];
        if ($response['response']->status->response_code == 'Received') {
            $result['error']  = 0;
            $result["result"] = $response['response']->result;
        } else {
            $result['error']   = 1;
            $result['message'] = isset($response['response']->status->reason_text) ? $response['response']->status->reason_text : 'Unknown error. Please contact your administrator';
            $result["all"]     = $response;
        }

        return $result;
    }

    public function successfulpaymentsReport($church_id, $requestBody) {

        $church = $this->CI->db->where('ch_id', $church_id)->get('church_detail')->row();

        if (!$church->epicpay_credentials) {
            $result['error']        = 1;
            $result['error_detail'] = "epicpay_credentials_missing";
            $result["message"]      = "The church is not connected to a payment processor";
            return $result;
        }

        $this->setAgentCredentials($church->epicpay_credentials);

        $this->use_url_rpt = true;
        $response          = $this->_makeCurlRequest('reporting/v1/', 'GetReport/successfulpayments', $requestBody);

        $result = [];
        if ($response['response']->status->response_code == 'Received') {
            $result['error']  = 0;
            $result["result"] = $response['response']->result;
        } else {
            $result['error']   = 1;
            $result['message'] = isset($response['response']->status->reason_text) ? $response['response']->status->reason_text : 'Unknown error. Please contact your administrator';
            $result["all"]     = $response;
        }

        return $result;
    }

    public function generalReport($church_id, $requestBody, $report) {

        $church = $this->CI->db->where('ch_id', $church_id)->get('church_detail')->row();

        if (!$church->epicpay_credentials) {
            $result['error']        = 1;
            $result['error_detail'] = "epicpay_credentials_missing";
            $result["message"]      = "The church is not connected to a payment processor";
            return $result;
        }

        $this->setAgentCredentials($church->epicpay_credentials);

        $this->use_url_rpt = true;
        $response          = $this->_makeCurlRequest('reporting/v1/', 'GetReport/' . $report, $requestBody);

        $result = [];
        if (isset($response['response']->status->response_code) && $response['response']->status->response_code == 'Received') {
            $result['error']  = 0;
            $result["result"] = $response['response']->result;
        } else {
            $result['error']   = 1;
            $result['message'] = isset($response['response']->status->reason_text) ? $response['response']->status->reason_text : 'Unknown error. Please contact your administrator';
            $result["all"]     = $response;
        }

        return $result;
    }

    /*     * **************************************************************************
     *
     * Create transaction directly on DB
     *
     * @param    array     $transationData holds the transaction data
     * @return   array     [error, message]
     *
     *
     * *************************************************************************** */

    public function dbCreateTransaction($transationData) {
        $response = [];

        $this->CI->db->insert(self::TABLE_CUSTOMER_TRX, $transationData);

        $trxId = $this->CI->db->insert_id();

        if ($trxId > 0) {
            $response['error'] = 0;
        } else {
            $response['error']   = 1;
            $response['message'] = 'Unknown error. Please contact your administrator';
        }

        return $response;
    }

    /*     * **************************************************************************
     *
     * Process DB webhooks
     *
     * @return   array     [error, message]
     *
     *
     * *************************************************************************** */

    public function processVerifyOrganizationCron() {

        $wh = $this->CI->db->where('status', 'U')->order_by('id', 'asc')
                        ->get(self::TABLE_CUSTOMER_WH)->result_object();

        foreach ($wh as $key => $row) {
            $event = json_decode($row->event_json);

            $newStatus = 'I';

            // Check if event is for church setup
            if (isset($event->result->gateway_credential->api_key_password) && $event->result->gateway_credential->api_key_password != 'sandbox_api_password') {

                $churchId = $event->result->gateway_credential->client_app_id;

                $church = $this->CI->db->where('ch_id', $churchId)->get('church_detail')->row();

                if (empty($church)) {
                    $newStatus = 'E';
                } else {
                    $newStatus  = 'P';
                    $credential = $this->CI->encryption->encrypt($event->result->gateway_credential->api_key_id . ':' . $event->result->gateway_credential->api_key_password);
                    $this->CI->db->where('ch_id', $churchId)->update('church_detail', [
                        'epicpay_verification_status' => 'V',
                        'epicpay_credentials'         => $credential,
                        'epicpay_id'                  => $event->result->gateway_credential->epic_id,
                        'epicpay_gateway_id'          => $event->result->gateway_credential->gateway_id,
                    ]);

                    //===== zapier                    
                    $this->CI->load->library('curl');
                    $this->CI->load->model('user_model');
                    $user        = $this->CI->user_model->get($church->client_id);
                    $zapier_url  = 'https://hooks.zapier.com/hooks/catch/8146183/ofsq2rx/';
                    $zapier_data = [
                        'message'      => 'epicpay-organization-approved',
                        'first_name'   => ucwords(strtolower($user->first_name)),
                        'last_name'    => ucwords(strtolower($user->last_name)),
                        'email'        => $user->email,
                        'phone'        => $user->phone,
                        'organization' => ucwords(strtolower($church->church_name))];

                    if (ZAPIER_ENABLED)
                        $this->CI->curl->post($zapier_url, $zapier_data);
                    //===== zapier end
                }
            }

            $this->CI->db->where('id', $row->id)->update('epicpay_webhooks', ['status' => $newStatus, 'updated_at' => date('Y-m-d H:i:s')]);
        }
    }

    public function test() {

        $body = [
            'amount'                => 100,
            'currency'              => 'usd',
            'method'                => 'credit_card',
            'transaction_type'      => 'Sale',
            'client_customer_id'    => 'XYZ1010',
            'credit_card'           => [
                'card_number'      => '4111111111111111',
                'card_holder_name' => 'Bob Smith',
                'exp_month'        => '01',
                'exp_year'         => '2020',
                'cvv'              => '123',
            ],
            'client_transaction_id' => 'TRX101020',
            'customer_address'      => [
                'first_name'  => "Bob",
                'last_name'   => "Smith",
                'postal_code' => 33166
            ],
            'billing_address'       => [
                'first_name'  => "Bob",
                'last_name'   => "Smith",
                'postal_code' => 33166
            ],
        ];

        $response = $this->_makeCurlRequest('payment/v1/', 'authorize', $body);

        return $response;
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
        $churchObj = $this->CI->organization_model->getWhere('ch_id, epicpay_verification_status, epicpay_credentials, church_name, slug', ['twilio_phoneno' => $to], false, 'ch_id desc');

        $churchObj = $churchObj ? (object) $churchObj[0] : null;

        if (empty($churchObj)) {
            echo $TwilioInstance->msgResponse('You are not associated with this organization.');
            return;
        } else if ($churchObj->epicpay_verification_status != 'V' || $churchObj->epicpay_credentials == null || $churchObj->epicpay_credentials == '') {
            echo $TwilioInstance->msgResponse('This organization is not ready for receiving donations. Please contact an administrator.');
            return;
        }

        $churchId = $churchObj->ch_id;

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

        $trx = $this->CI->db->where('mobile_no', $from)->where('church_id', $churchId)
                        ->where('donarid', $accountDonor->id)->where('active', 1)
                        ->where('date_time >= NOW() - INTERVAL 10 MINUTE', null, false)
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
                            $message = 'Donation processed! Thanks so much for your generosity!';
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
                            $message = 'Donation processed! Thanks so much for your generosity!';
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
                            $message = 'Donation processed! Thanks so much for your generosity!';
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
        return $this->CI->db->where('is_active', 'Y')->where('is_saved', 'Y')
                        ->where('account_donor_id', $accountDonorId)->where_not_in('status', ['E'])
                        ->get(self::TABLE_CUSTOMER_SOURCES)->result_object();
    }

    private function _twilioUpdateTrx($trxId, $data) {
        $this->CI->db->where('id', $trxId)->update(self::TABLE_MOBILE_TRX, $data);
    }

    private function _twilioProcessTrx($trxId) {
        $trx      = $this->CI->db->where('id', $trxId)->get(self::TABLE_MOBILE_TRX)->row();
        $accDonor = $this->CI->db->where('id', $trx->donarid)->get('account_donor')->row();
        $church   = $this->CI->db->where('ch_id', $trx->church_id)->get('church_detail')->row();

        $epicCus = $this->CI->db->where('account_donor_id', $trx->donarid)
                        ->where('status', 'P')
                        ->order_by('id', 'desc')
                        ->get(self::TABLE_CUSTOMERS)->row();

        $epicCusSource = $this->CI->db->where('customer_id', $epicCus->id)->where('epicpay_wallet_id', $trx->sourceid)
                        ->get(self::TABLE_CUSTOMER_SOURCES)->row();

        if ($church->epicpay_credentials == null || $church->epicpay_credentials == '') {
            return ['error' => 1, 'message' => 'This organization is not ready for receiving donations. Please contact an administrator.'];
        }

        $this->setAgentCredentials($church->epicpay_credentials);

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
        $trxn_->template     = $church->epicpay_template;
        $trxn_->src          = $epicCusSource->source_type === "card" ? "CC" : "BNK";
        $fee                 = getEpicPayFee($trxn_);
        $sub_total_amount    = $trx->amount - $fee;

        $transactionData = [
            'customer_id'         => $epicCus->id,
            'customer_source_id'  => $epicCusSource->id,
            'church_id'           => $trx->church_id,
            'account_donor_id'    => $trx->donarid,
            'total_amount'        => $trx->amount,
            'sub_total_amount'    => $sub_total_amount,
            'fee'                 => $fee,
            'first_name'          => $accDonor->first_name,
            'last_name'           => $accDonor->last_name,
            'email'               => $accDonor->email,
            'phone'               => $trx->mobile_no,
            'zip'                 => $customerData['customer_address']['postal_code'],
            'giving_source'       => 'sms',
            //'giving_type'         => $trx->giving_type,
            'epicpay_customer_id' => $epicCus->epicpay_customer_id,
            'epicpay_wallet_id'   => $epicCusSource->epicpay_wallet_id,
            'src'                 => $trxn_->src,
            'template'            => $church->epicpay_template,
            'is_fee_covered'      => 0
        ];

        $paymentData = [
            'amount'           => (int) ((string) ($trx->amount * 100)), /* --- bcmul should used here we need to install this on servers (aws and ssdnodes) --- */
            'currency'         => 'usd',
            'transaction_type' => 'Sale',
            'method'           => 'wallet',
            'wallet'           => [
                'wallet_id' => $trx->sourceid
            ],
        ];

        if ($trxn_->src == 'BNK') {
            $paymentData['sec_code'] = 'WEB';
        }

        if (in_array($trx->church_id, TEST_ORGNX_IDS)) {
            $this->setTesting(true);
        }

        $response = $this->createTransaction($transactionData, $customerData, $paymentData, $trx->giving_type);

        if ($response['error'] == 1) {
            $response['message'] = 'Sorry your donation was declined, please try again with a different payment source.';
        } else {
            if ($transactionData['src'] == 'CC') {
                $transactionData["trxId"] = $response["trxId"];
                $this->CI->load->helper('emails');
                sendDonationEmail($transactionData, false, $trx->giving_type);
            }
        }

        $this->CI->db->where('id', $trx->id)->update(self::TABLE_MOBILE_TRX, ['active' => 0]);

        return $response;
    }

    public function getFrequency($recurring) {

        $frequency = ['frequency' => 'one_time', 'period' => null];

        if ($recurring == 'week') {
            $frequency['frequency'] = 'every_n_weeks';
            $frequency['period']    = '1';
        } else if ($recurring == 'month') {
            $frequency['frequency'] = 'every_n_months';
            $frequency['period']    = '1';
        } else if ($recurring == 'quarterly') {
            $frequency['frequency'] = 'every_n_months';
            $frequency['period']    = '4';
        } else if ($recurring == 'year') {
            $frequency['frequency'] = 'every_n_months';
            $frequency['period']    = '12';
        }

        return $frequency;
    }

    private function _makeCurlRequest($api, $path, $body = null) {
        if ($this->use_url_rpt) {
            $url = $this->testing ? self::URL_RPT_TEST : self::URL_RPT . $api . $path;
        } else {
            $url = $this->testing ? self::URL_TEST . $api . $path : self::URL . $api . $path;
        }

        $secretKey = $this->agentCredentials != null ? base64_encode($this->CI->encryption->decrypt($this->agentCredentials)) : base64_encode($this->userName . ':' . $this->userPass);

        //log_message('error', 'Key: '.$secretKey);
        $bodyString        = json_encode($body);
        $request_headers   = [];
        $request_headers[] = 'Authorization: Basic ' . $secretKey;
        $request_headers[] = 'Content-Type: application/json';
        $request_headers[] = 'Content-Length: ' . strlen($bodyString);
        $ch                = curl_init();

        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
        curl_setopt($ch, CURLOPT_TIMEOUT, 60);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $request_headers);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $bodyString);
        curl_setopt($ch, CURLINFO_HEADER_OUT, true);
        $data = curl_exec($ch);

        if (curl_errno($ch)) {
            return ['error' => 1, 'response' => 'Network error: ' . curl_error($ch)];
        } else {
            // log_message('error', json_encode($info));       
            // log_message('error', json_encode($headerSent));       
            $transaction = json_decode($data);

            /*
              if( strpos(json_encode($transaction), 'Invalid Header') !== false) {
              $info = curl_getinfo($ch);
              $headerSent = curl_getinfo($ch, CURLINFO_HEADER_OUT );
              log_message('error', 'Headers sent to curl: ' . json_encode($request_headers));
              $logBodyString = json_decode($bodyString);
              if(isset($logBodyString->credit_card->card_number)){
              unset($logBodyString->credit_card->card_number);
              }
              if(isset($logBodyString->credit_card->cvv)){
              unset($logBodyString->credit_card->cvv);
              }
              log_message('error', 'Body string sent to curl: ' . json_encode($logBodyString));
              log_message('error', 'Info from curl: ' . json_encode($info));
              log_message('error', 'Headers from curl: ' . json_encode($headerSent));
              }
             */

            curl_close($ch);
            return ['error' => 0, 'response' => $transaction];
        }
    }

    public function processUpdateWallet($source, $requestBody) {
        $church_id = $source->church_id;
        $wallet    = $source->epicpay_wallet_id;

        $this->CI->db->where("id", $source->id)->update("epicpay_customer_sources", [
            "request_data_update" => json_encode($requestBody),
            "updated_at"          => date("Y-m-d H:i:s")
        ]);

        $church = $this->CI->db->where('ch_id', $church_id)->get('church_detail')->row();

        if (!$church->epicpay_credentials) {
            $result['error']        = 1;
            $result['error_detail'] = "epicpay_credentials_missing";
            $result["message"]      = "The church is not connected to a payment processor";
            return $result;
        }

        $this->setAgentCredentials($church->epicpay_credentials);

        $response                 = $this->_makeCurlRequest('payment/v1/', 'editwalletitem/' . $wallet, $requestBody);
        $response["_response_at"] = date("Y-m-d H:i:s");

        $save_resp = [];
        if ($source->request_response_update) {
            $save_resp = json_decode($source->request_response_update);
        }
        $save_resp[] = $response;

        $result = [];
        if ($response['response']->status->response_code == 'Received') {
            $this->CI->db->where("id", $source->id)->update("epicpay_customer_sources", [
                "request_response_update" => json_encode($save_resp), "updated_at"              => date("Y-m-d H:i:s"),
                "name_holder"             => $requestBody["account_holder_name"],
                "postal_code"             => $requestBody["billing_address"]["postal_code"],
                "exp_month"               => isset($requestBody["exp_month"]) ? $requestBody["exp_month"] : null,
                "exp_year"                => isset($requestBody["exp_year"]) ? $requestBody["exp_year"] : null,
                "ask_wallet_update"       => null,
            ]);

            $result['error']  = 0;
            $result["result"] = $response['response']->result;
        } else {
            $this->CI->db->where("id", $source->id)->update("epicpay_customer_sources", [
                "request_response_update" => json_encode($save_resp),
                "updated_at"              => date("Y-m-d H:i:s")
            ]);

            $result['error']   = 1;
            $result['message'] = isset($response['response']->status->reason_text) ? $response['response']->status->reason_text : 'Unknown error. Please contact your administrator';
            $result["all"]     = $response;
        }

        return $result;
    }

    public function processUpdateSubscription($sub, $requestBody, $newAmount) {

        $church = $this->CI->db->where('ch_id', $sub->church_id)->get('church_detail')->row();

        if (!$church->epicpay_credentials) {
            $result['error']        = 1;
            $result['error_detail'] = "epicpay_credentials_missing";
            $result["message"]      = "The church is not connected to a payment processor";
            return $result;
        }

        $this->setAgentCredentials($church->epicpay_credentials);

        $response = $this->_makeCurlRequest('payment/v1/', 'editsubscription/' . $sub->epicpay_subscription_id, $requestBody);

        $response["_response_at"] = date("Y-m-d H:i:s");
        $response["_last_amount"] = $sub->amount;

        unset($requestBody->credit_card);
        unset($requestBody->bank_account);
        $response["_request"] = $requestBody;

        $save_resp = [];
        if ($sub->request_response_update) {
            $save_resp = json_decode($sub->request_response_update);
        }
        $save_resp[] = $response;

        $result = [];
        if ($response['response']->status->response_code == 'Received') {
            $this->CI->db->where("id", $sub->id)->update("epicpay_customer_subscriptions", [
                "request_response_update" => json_encode($save_resp), "updated_at"              => date("Y-m-d H:i:s"),
                "amount"                  => $newAmount
            ]);

            $this->CI->db->where("customer_subscription_id", $sub->id)->update("epicpay_customer_transactions", [
                "amount_upd" => null
            ]);

            $result['error']  = 0;
            $result["result"] = $response['response']->result;
        } else {
            $this->CI->db->where("id", $sub->id)->update("epicpay_customer_subscriptions", [
                "request_response_update" => json_encode($save_resp),
                "updated_at"              => date("Y-m-d H:i:s")
            ]);

            $result['error']   = 1;
            $result['message'] = isset($response['response']->status->reason_text) ? $response['response']->status->reason_text : 'Unknown error. Please contact your administrator';
            $result["all"]     = $response;
        }

        return $result;
    }

    public function createSubscriptionMigration($transactionData, $customerData, $paymentData) {

        $requestBody['amount']            = $paymentData['amount'];
        $requestBody['currency']          = $paymentData['currency'];
        $requestBody['method']            = $paymentData['method'];
        $requestBody['next_payment_date'] = $paymentData['next_payment_date'];
        $requestBody['frequency']         = $paymentData['frequency'];
        $requestBody['period']            = $paymentData['period'];
        //$requestBody['customer_address'] = $customerData['customer_address'];
        //$requestBody['billing_address'] = $customerData['customer_address'];
        $paymentMethodLastDigits          = null;

        $requestBody['wallet'] = $paymentData['wallet'];

        // Create subscription
        $subscriptionData               = [
            'customer_id'              => $transactionData['customer_id'],
            'customer_source_id'       => $transactionData['customer_source_id'],
            'church_id'                => $transactionData['church_id'],
            'campus_id'                => $transactionData['campus_id'],
            'frequency'                => $paymentData['cb_frequency'],
            'start_on'                 => $paymentData['next_payment_date'],
            'amount'                   => $transactionData['total_amount'],
            'account_donor_id'         => $transactionData['account_donor_id'],
            'first_name'               => $transactionData['first_name'],
            'last_name'                => $transactionData['last_name'],
            'email'                    => $transactionData['email'],
            'zip'                      => $transactionData['zip'],
            'giving_source'            => $transactionData['giving_source'],
            'giving_type'              => $transactionData['giving_type'],
            'epicpay_template'         => $transactionData['template'],
            'src'                      => $transactionData['src'],
            'is_fee_covered'           => $transactionData['is_fee_covered'],
            'tags'                     => isset($transactionData['tags']) ? $transactionData['tags'] : null,
            'from_stripemigration_sid' => $transactionData["from_stripemigration_sid"],
        ];
        $subscriptionData['created_at'] = date('Y-m-d H:i:s');

        //d($subscriptionData);
        //d($requestBody);

        $this->CI->db->insert(self::TABLE_CUSTOMER_SUBS, $subscriptionData);
        $subId = $this->CI->db->insert_id();

        // Create transaction
        $transactionData['request_data']             = $requestBody;
        $transactionData['customer_subscription_id'] = $subId;
        $transactionData['created_at']               = date('Y-m-d H:i:s');

        // Protect credit card or bank information
        unset($transactionData['request_data']['credit_card']);
        unset($transactionData['request_data']['bank_account']);
        $transactionData['request_data']['last_digits'] = $paymentMethodLastDigits;
        $transactionData['request_data']                = json_encode($transactionData['request_data']);

        //d($requestBody);

        $response = $this->_makeCurlRequest('payment/v1/', 'addsubscription', $requestBody);

        if ($response['response']->status->response_code == 'Received') {

            $updateData = [
                'epicpay_customer_id'     => $response['response']->result->subscription->customer_id,
                'epicpay_wallet_id'       => $response['response']->result->subscription->wallet_id,
                'epicpay_subscription_id' => $response['response']->result->subscription->subscription_id,
                'request_response'        => json_encode($response),
                'updated_at'              => date('Y-m-d H:i:s'),
                'status'                  => 'A',
                'request_data'            => $transactionData['request_data']
            ];
            $this->CI->db->update(self::TABLE_CUSTOMER_SUBS, $updateData, ['id' => $subId]);
            $updateData = [
                'epicpay_customer_id'    => $response['response']->result->subscription->customer_id,
                'epicpay_wallet_id'      => $response['response']->result->subscription->wallet_id,
                'request_response'       => json_encode($response),
                'epicpay_transaction_id' => isset($response['response']->result->payment->transaction_id) ? $response['response']->result->payment->transaction_id : null,
                'updated_at'             => date('Y-m-d H:i:s'),
                'status'                 => 'P'
            ];

            $response['error'] = 0;
        } else {
            $response['error'] = 1;
            $updateData        = [
                'request_response' => json_encode($response),
                'updated_at'       => date('Y-m-d H:i:s'),
                'status'           => 'N',
                'request_data'     => $transactionData['request_data']
            ];

            $this->CI->db->update(self::TABLE_CUSTOMER_SUBS, $updateData, ['id' => $subId]);

            $response['details'] = $response;
        }

        //$this->CI->db->update(self::TABLE_CUSTOMER_TRX, $updateData, ['id'  =>  $trxId]);

        return $response;
    }

}
