<?php

if (!defined('BASEPATH'))
    exit('No direct script access allowed');

/**
 * PaySafe class to handle all inbound and outbound requests
 *
 */
class FortisLib
{

    const TABLE_CUSTOMERS          = 'epicpay_customers';
    const TABLE_CUSTOMER_WH        = 'fortis_webhooks';
    const TABLE_CUSTOMER_SOURCES   = 'epicpay_customer_sources';
    const TABLE_CUSTOMER_SUBS      = 'epicpay_customer_subscriptions';
    const TABLE_CUSTOMER_TRX       = 'epicpay_customer_transactions';
    const TABLE_CUSTOMER_TRX_TR    = 'epicpay_customer_trx_transfers';
    const TABLE_MOBILE_TRX         = 'mobile_transaction';
    const URL                      = 'https://api.fortis.tech/v1/';
    const URL_TEST                 = 'https://api.sandbox.fortis.tech/v1/';

    private $encryptPhrase;
    private $developerId;
    private $userId;
    private $userApiKey;
    private $locationId;

    private $testing               = false;
    private $logSensibleData       = FALSE; // WARNING PUT IT TO FALSE ON PRD/LIVE ENVIRONMENT
    public $environment    = null;
    private $mainUserId            = null;
    
    function __construct()
    {
        $this->CI = &get_instance();

        $this->CI->load->helper('paysafe');
        $this->CI->load->helper('fortis');

        $this->encryptPhrase = $this->CI->config->item('fortis_encrypt_phrase');

        $this->environment = $this->CI->config->item('fortis_environment');

        if ($this->environment === 'dev') {
            $this->setTesting(true);
        } else if ($this->environment === 'prd') {
            $this->setTesting(false);
            $this->logSensibleData = false; // WARNING PUT IT TO FALSE ON PRD/LIVE ENVIRONMENT
        } else {
            throw new Exception('Internal error, incorrect payment processor settings');
        }

        $this->CI->load->library('encryption');

        $this->CI->encryption->initialize($this->getEncryptDetails());

        //SYSTEM_LETTER_ID is included as reference when making a payment or creating some resources on the payment processor side, for example a trnx id sent would be something like SYSTEM_LETTER_ID . '-' . $trxId...;
        //SYSTEM_LETTER_ID => L = Lunarpay, C = Chatgive, H = CoachPay 
        $this->CI->load->model('setting_model');
        $this->SYSTEM_LETTER_ID = $this->CI->setting_model->getItem('SYSTEM_LETTER_ID');
    }

    public function setTesting($value)
    {
        if ($value) {
            $this->paysafe_product_codes = PAYSAFE_PRODUCT_CODES_TEST;
            
        } else {
            $this->paysafe_product_codes = PAYSAFE_PRODUCT_CODES_LIVE;
            
        }
        $this->testing = $value;
    }

    public function getEncryptDetails() {
        return  [
            'cipher' => 'aes-256',
            'mode'   => 'ctr',
            'key'    => $this->encryptPhrase
        ];
    }

    public function getMerchantPricingTemplate($orgId) {
        $merchant = $this->CI->db->select('fortis_template')->where('ch_id', $orgId)->get('church_detail')->row();

        if(!$merchant) {
            throw new Exception('Internal error, merchant not found. No template available');
        }

        return $merchant->fortis_template;
        
    }

    /**
     * Set the master credentials for onboarding
     * it holds the developerId, userId and userApiKey 
    */
    private function setOnboardingCredentials()
    {
        if($this->testing) {
            $this->developerId = $this->CI->config->item('fortis_developer_id_sandbox');
            $this->userId = $this->CI->config->item('fortis_onboarding_user_id_sandbox');
            $this->userApiKey = $this->CI->config->item('fortis_onboarding_user_api_key_sandbox');
        } else { //PRODUCTION
            $this->developerId = $this->CI->config->item('fortis_developer_id_production');
            $this->userId = $this->CI->config->item('fortis_onboarding_user_id_production');
            $this->userApiKey = $this->CI->config->item('fortis_onboarding_user_api_key_production'); 
        }
    }

    /**
     * Set the credentials for the merchant
     * it holds the developerId, userId, userApiKey
    */
    public function setAgentCredentials($orgId)
    {
        $this->developerId = $this->CI->config->item($this->testing ? 'fortis_developer_id_sandbox' : 'fortis_developer_id_production');

        $onboard = $this->CI->db->select('credentials, location_id')->where('church_id', $orgId)->get('church_onboard_fortis')->row();
    
        if(empty($onboard->credentials) || empty($onboard->location_id)) {
            if($this->testing) {
                $this->userId = $this->CI->config->item('fortis_user_id_sandbox');
                $this->userApiKey = $this->CI->config->item('fortis_user_api_key_sandbox');
                $this->locationId = $this->CI->config->item('fortis_location_id_sandbox');        

                //throw new Exception('Internal error, merchant credentials not found');
            } else {
                throw new Exception('Internal error, merchant credentials not found');
            }
        } else { //if credentials are found set them from the database
            $credentialsJson = $this->CI->encryption->decrypt($onboard->credentials);
            if ($credentialsJson === FALSE) { //error
                //Continue, the error will be thrown when attempting to make the call                
            } else {
                $credentialsObj = json_decode($credentialsJson);
                $this->userId = $credentialsObj->user_id;
                $this->userApiKey = $credentialsObj->user_api_key;
                $this->locationId = $onboard->location_id; //the location id is not included in the authentication headers, but it is available in the fortilib object, it is used for example on the createTransactionIntention method
            }
        }
    }

    public function getProductTransactionIds($orgId) {
        $this->CI->load->model('orgnx_onboard_fts_model');

        $this->CI->orgnx_onboard_fts_model->secure_check = false;

        $ornx_onboard_fts = $this->CI->orgnx_onboard_fts_model->getByOrg($orgId, null, ['id', 'cc_product_transaction_id', 'ach_product_transaction_id']);

        if ($ornx_onboard_fts) {
            return [
                'cc_product_transaction_id' => $ornx_onboard_fts->cc_product_transaction_id,
                'ach_product_transaction_id' => $ornx_onboard_fts->ach_product_transaction_id,
            ];
        } else {
            return [
                'cc_product_transaction_id' => null,
                'ach_product_transaction_id' => null,
            ];
        }
            
    }

    //=============
    public function onboardMerchant($requestBody)
    { 
        $this->setOnboardingCredentials();
        $resp = $this->_makeCurlRequest('onboarding', $requestBody);

        if (isset($resp['response']->type) && $resp['response']->type == "Error") {

            if (is_object($resp['response']->detail)) {
                $message = '<p>' . $resp['response']->detail->title . '</p>';

                foreach ($resp['response']->detail->detail->errors as $errorMessages) {
                    foreach ($errorMessages as $error) {
                        if(is_string($error)) {
                            $message .= '<p>' . $error . '</p>';    
                        } else {
                            $message .= '<p>Error: ' . json_encode($error) . '</p>';
                        }
                        
                    }
                }
            } else {
                $message = $resp['response']->detail;
            }
            return ['status' => false, 'result' => $resp['response'], 'message' => $message];
        } else {
            return ['status' => true, 'result' => $resp['response']];
        }
    }

    /**
     * Create a webhook for the merchant account status, for now creating only for ach
     * @return array
    */
    public function createTransactionWebhook($locationId, $productTransactionId, $orgId, $type)
    {
        if($type === 'ach') {
            $method = $type . '_transaction_listener'; //ach_transaction_listener
        } else {
            throw new Exception('Invalid webhook type');
        }

        $whData = [
            "attempt_interval" => 300,
            //"expands" => "changelogs,tags",
            "basic_auth_username" => $_ENV['fortis_transaction_webhook_basic_auth_username'],
            "basic_auth_password" => $_ENV['fortis_transaction_webhook_basic_auth_password'],
            "format" => "api-default",
            "is_active" => true,
            "on_create" => false,
            "on_update" => true,
            "on_delete" => false,
            "resource" => "transaction",
            "number_of_attempts" => 1,
            "location_id" => $locationId,
            "product_transaction_id" => $productTransactionId,
            'url' => IS_DEVELOPER_MACHINE ? 
                    'http://52.23.144.107/fortiswebhooks/test.php?client_app_id=' . $orgId : 
                     BASE_URL . 'fortiswebhooks/'. $method . '/' . $orgId
            //"url" => 'https://app.lunarpay.com/fortiswebhooks/ach_transaction_listener/' . $orgId,
            //"url" => BASE_URL . 'fortiswebhooks/ach_transaction_listener/' . $orgId
        ];

        $resp = $this->_makeCurlRequest('webhooks/transaction', $whData);

        if (
            isset($resp['response']->type) && $resp['response']->type == "Webhook" &&
            isset($resp['response']->data->is_active) && $resp['response']->data->is_active == true
        ) {

            $webhookId = $resp['response']->data->id;
            $this->CI->load->model('fts_trxns_tracked_wh_model');
            $this->CI->fts_trxns_tracked_wh_model->insert([
                'client_app_id' => $orgId,
                'webhook_id' => $webhookId,
                'request' => json_encode($whData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES),
                'response' => json_encode($resp['response'], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES),
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ]);
            
            return ['status' => true, 'message' => "$type transaction webhook successfully created"];
        } else {
            return ['status' => false, 'message' => "$type transaction webhook error: " .  (isset($resp['response']->detail) ? $resp['response']->detail : 'undefined' ), 'errors' => isset($resp['response']->meta) ? $resp['response']->meta : null];
        }
    }

    //trxType can be DO for api transactions and RE for refunds
    private function getTotalTransactionAmountFromBatchByType($batchId, $orgId, $trxType)
    {
        $totalAmount = 0;

        $transactions = $this->CI->db->from(SELF::TABLE_CUSTOMER_TRX)
            ->where('transaction_batch_id', $batchId)
            ->where('trx_type', $trxType)
            ->where('church_id', $orgId)
            ->select('sub_total_amount')
            ->get()
            ->result();

        foreach ($transactions as $transaction) {
            $totalAmount += $transaction->sub_total_amount;
        }

        return $totalAmount;
    }

    /*
    * Get the list of all the batches
    
    batch format from the API:
        {
            "id": "11efae7985b87970b5ad8340",
            "batch_num": 13,
            "is_open": 1,
            "processing_status_id": 1,
            "product_transaction_id": "11eecaab9dde23f4a72e8ba5",
            "created_ts": 1732902440,
            "settlement_file_name": null,
            "batch_close_ts": null,
            "batch_close_detail": null,
            "total_sale_amount": 25000,
            "total_sale_count": 2,
            "total_refund_amount": 0,
            "total_refund_count": 0,
            "total_void_amount": 0,
            "total_void_count": 0,
            "total_blind_refund_amount": 0,
            "total_blind_refund_count": 0,
            "risk_flag": 0,
            "risk_code": null
        },
    */
    public function getPayouts($orgId, $requestBody) {

        $this->setAgentCredentials($orgId);

        $month = str_replace('/', '-', $requestBody['month']);

        // Start of the month
        $dateStart = date('Y-m-d', strtotime($month . '-01'));
        $dateStartTimeStamp = strtotime($dateStart . ' 00:00:00'); // Explicitly set time to 00:00:00

        // End of the month
        $dateEnd = date('Y-m-t', strtotime($month));
        $dateEndTimeStamp = strtotime($dateEnd . ' 23:59:59'); // Explicitly set time to 23:59:59

        $queryParams = [
            'page' => [
                'number' => 1,
                'size' => 5000,
            ],
            'filter_by' => [
                [
                    'key' => 'created_ts',
                    'operator' => '>=',
                    'value' => $dateStartTimeStamp,
                ],
                [
                    'key' => 'created_ts',
                    'operator' => '<=',
                    'value' => $dateEndTimeStamp,
                ],
            ]
        ];

        $url = 'batches?' . http_build_query($queryParams);

        $batches = $this->_makeCurlRequest($url, null, 'get');

        if($batches['response']->type === 'Error') {
            if(isset($batches['response']->detail)) {
                throw new Exception($batches['response']->detail);
            } else {
                throw new Exception('An error ocurred');
            }
        }

        $list = $batches['response']->list;

        $groupedData = [];

        //credit card batches
        foreach($list as $batch) {

            $totalNetAmount = $this->getTotalTransactionAmountFromBatchByType($batch->id, $orgId, 'DO');
            
            $groupedData[$batch->id] = [
                'id' => $batch->id,
                'batch_num' => $batch->batch_num,
                'is_open' => $batch->is_open,
                'processing_status_id' => $batch->processing_status_id,
                'product_transaction_id' => $batch->product_transaction_id,
                'created_ts' => $batch->created_ts,
                'settlement_file_name' => $batch->settlement_file_name,
                'batch_close_ts' => $batch->batch_close_ts,
                'batch_close_detail' => $batch->batch_close_detail,
                'total_sale_amount' => bcdiv($batch->total_sale_amount, '100', 2),
                'total_sale_count' => $batch->total_sale_count,
                'total_refund_amount' => bcdiv($batch->total_refund_amount, '100', 2),
                'total_refund_count' => $batch->total_refund_count,
                'total_void_amount' => bcdiv($batch->total_void_amount, '100', 2),
                'total_void_count' => $batch->total_void_count,
                'total_blind_refund_amount' => bcdiv($batch->total_blind_refund_amount, '100', 2),
                'total_blind_refund_count' => $batch->total_blind_refund_count,
                'risk_flag' => $batch->risk_flag,
                'risk_code' => $batch->risk_code,
                //own fields
                '_type' => 'Credit Card',
                '_fts_status_id' => null,
                '_processing_status_id' => null,
                '_processing_status_label' => FORTIS_BATCH_STATUS_LABELS[$batch->processing_status_id],
                '_total_net_amount' => $totalNetAmount
                
            ];
        }

        $resultACH = $this->CI->db
            ->select('id, transaction_batch_id, epicpay_transaction_id, src, fts_status_id, status, status_ach,
            total_amount, sub_total_amount, fee, trx_type, created_at')
            ->where('church_id', $orgId)
            ->where('src = "BNK" AND status = "P"', null, false)
            ->where('created_at >=', date('Y-m-d 00:00:00', $dateStartTimeStamp))
            ->where('created_at <=', date('Y-m-d 23:59:59', $dateEndTimeStamp))
            ->order_by('id', 'DESC')
            ->get(SELF::TABLE_CUSTOMER_TRX)->result();

        
        foreach ($resultACH as $record) {
            
            $batchId = $record->epicpay_transaction_id . '-B';

            $groupedData[$batchId] = [ //in this case the batchId is the epicpay_transaction_id + b for grouping
                'id' => $record->epicpay_transaction_id, //without b
                'batch_num' => null,
                'is_open' => null,
                'processing_status_id' => null,
                'product_transaction_id' => null,
                'created_ts' => strtotime($record->created_at),
                'settlement_file_name' => null,
                'batch_close_ts' => null,
                'batch_close_detail' => null,
                'total_sale_amount' => $record->trx_type !== 'RE' ? $record->sub_total_amount : 0,
                'total_sale_count' => $record->trx_type !== 'RE' ? 1 : 0,
                'total_refund_amount' => $record->trx_type === 'RE' ? $record->sub_total_amount * -1: 0,
                'total_refund_count' => $record->trx_type === 'RE' ? 1 : 0,
                'total_void_amount' => 0,
                'total_void_count' => 0,
                'total_blind_refund_amount' => 0,
                'total_blind_refund_count' => 0,
                'risk_flag' => null,
                'risk_code' => null,
                //own fields
                '_type' => 'Bank',
                '_fts_status_id' => $record->fts_status_id,
                '_processing_status_id' => null,
                '_processing_status_label' => FORTIS_STATUS_LABELS[$record->fts_status_id], //here we put not the batch label but the ach transaction label
                '_total_net_amount' => $record->trx_type !== 'RE' ? $record->sub_total_amount : 0
            ];
        }

        return $groupedData;

    }

    public function getPayout($orgId, $payoutId, $type)
    {
        $this->setAgentCredentials($orgId);

        //$transaction = $this->getTransaction('31efced318397460ac144d97');
        // echo json_encode($transaction, JSON_PRETTY_PRINT); die;

        if ($type === 'cc') {
            $resp = $this->_makeCurlRequest('batches/' . $payoutId, null, 'get');

            if (isset($resp['response']->data->processing_status_id)) {
                $resp['response']->data->_type = 'Credit Card';
                $resp['response']->data->_fts_status_id = null;
                $resp['response']->data->_processing_status_id = null;
                $resp['response']->data->_processing_status_label = FORTIS_BATCH_STATUS_LABELS[$resp['response']->data->processing_status_id];
            }

            return $resp;
        } else if ($type === 'bank') {

            $resultACH = $this->CI->db
            ->select('id, transaction_batch_id, epicpay_transaction_id, src, fts_status_id, status, status_ach,
            total_amount, sub_total_amount, fee, trx_type, created_at')
            ->where('church_id', $orgId)
            ->where('epicpay_transaction_id', $payoutId)
            ->get(SELF::TABLE_CUSTOMER_TRX)->row();

            $batch = [ 
                'id' => $resultACH->epicpay_transaction_id, //without b
                'batch_num' => null,
                'is_open' => null,
                'processing_status_id' => null,
                'product_transaction_id' => null,
                'created_ts' => strtotime($resultACH->created_at),
                'settlement_file_name' => null,
                'batch_close_ts' => null,
                'batch_close_detail' => null,
                'total_sale_amount' => $resultACH->trx_type !== 'RE' ? $resultACH->sub_total_amount * 100 : 0,
                'total_sale_count' => $resultACH->trx_type !== 'RE' ? 1 : 0,
                'total_refund_amount' => $resultACH->trx_type === 'RE' ? $resultACH->sub_total_amount * -100: 0,
                'total_refund_count' => $resultACH->trx_type === 'RE' ? 1 : 0,
                'total_void_amount' => 0,
                'total_void_count' => 0,
                'total_blind_refund_amount' => 0,
                'total_blind_refund_count' => 0,
                'risk_flag' => null,
                'risk_code' => null,
                //own fields
                '_type' => 'Bank',
                '_fts_status_id' => $resultACH->fts_status_id,
                '_processing_status_id' => null,
                '_processing_status_label' => FORTIS_STATUS_LABELS[$resultACH->fts_status_id], //here we put not the batch label but the ach transaction label
            ];
        
            $resp['response'] = new stdClass();
            $resp['response']->data = (object) $batch;
            
            
            return $resp;
        } else {
            show_404();
        }
    }

    public function getPayoutCcTransactions($orgId, $payoutId) {
        $this->setAgentCredentials($orgId);
        
        $params = http_build_query([
            'page' => [
                'number' => 1,
                'size' => 5000,
            ],
            'filter_by' => [
                [
                    'key' => 'transaction_batch_id',
                    'operator' => '=',
                    'value' => $payoutId,
                ],
            ],
        ]);
        
        $url = 'transactions?' . $params;
        
        $resp = $this->_makeCurlRequest($url, null, 'get');

        foreach($resp['response']->list as &$trxn) {
            $localTrxn = $this->CI->db->select('total_amount, sub_total_amount, fee')
            ->where('epicpay_transaction_id', $trxn->id)
            ->where('church_id', $orgId)
            ->get(self::TABLE_CUSTOMER_TRX)->row();
            $trxn->_sub_total_amount =  $localTrxn ? abs($localTrxn->sub_total_amount) : 0;
        }

        return $resp;
    }

    public function getPayoutBankTransaction($orgId, $transactionId) {

        $this->setAgentCredentials($orgId);
        
        $resp = $this->getTransaction($transactionId);

        if (isset($resp['response']->data)) {
            $resp['response']->data->settle_date = strtotime($resp['response']->data->settle_date);
            $trxnId = $resp['response']->data->id;
            $localTrxn = $this->CI->db->select('total_amount, sub_total_amount, fee')
                ->where('epicpay_transaction_id', $trxnId)
                ->where('church_id', $orgId)
                ->get(self::TABLE_CUSTOMER_TRX)->row();

            $resp['response']->data->_sub_total_amount =  $localTrxn ? abs($localTrxn->sub_total_amount) : 0;
    
        } else {
            return ['error' => $resp['error'], 'response' => (object)['list' => []]];
        }

        return ['error' => $resp['error'], 'response' => (object)['list' => isset($resp['response']->data) ? [$resp['response']->data] : []]];
        
    }

    public function createTransactionIntention($data)
    {

        if($data['action'] === 'sale') {
            if (!isset($data['amount']) || !is_int($data['amount'])) {
                return ['status' => false, 'message' => 'Amount is required must be an integer'];
            }
        }

        $data['location_id'] = $this->locationId;
        
        $resp = $this->_makeCurlRequest('elements/transaction/intention', $data);
        
        if (isset($resp['response']->data->client_token)) {
            return ['status' => true, 'result' => ['client_token' => $resp['response']->data->client_token]];
        } else {
            return ['status' => false, 'message' => $resp['response']->detail ?? 'An error ocurred creating the transaction intention'];
        }

        return $resp;
    }

    public function createTicketIntention()
    {

        $payload['location_id'] = $this->locationId;
        
        $resp = $this->_makeCurlRequest('elements/ticket/intention', $payload);
        
        if (isset($resp['response']->data->client_token)) {
            return ['status' => true, 'result' => ['client_token' => $resp['response']->data->client_token]];
        } else {
            return ['status' => false, 'message' => $resp['response']->detail ?? 'An error ocurred creating the transaction intention'];
        }

        return $resp;
    }

    public function getTransaction($transactionId)
    {
        $resp = $this->_makeCurlRequest('transactions/' . $transactionId, null, 'get');
        return $resp;
    }
    
    private function _makeCurlRequest($path, $body = null, $method = 'post', $getFormat = null)
    {

        $url       = $this->testing ? self::URL_TEST . $path : self::URL . $path;

        $logConsoleWhenTesting = false;

        if (is_string($body)) {
            $bodyString = $body;
        } else {
            $bodyString = json_encode($body);
        }
        
        $request_headers = [
            'Accept: application/json',
            'Content-Type: application/json',
            'developer-id: ' . $this->developerId,
            'user-id: ' . $this->userId,
            'user-api-key: ' . $this->userApiKey,
        ];

        $ch                = curl_init();

        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
        curl_setopt($ch, CURLOPT_HEADER, $getFormat == 'html' ? TRUE : FALSE);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $request_headers);

        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);

        if ($this->testing && IS_DEVELOPER_MACHINE) { //IMPORTANT, DO NOT LOG REQUESTS ON THE SERVER
            $this->CI->db->insert('request_logs', ['type' => 'REQ', 'headers' => json_encode($request_headers), 'url' => $url, 'method' => $method, 'payload' => json_encode($body, JSON_PRETTY_PRINT), 'date' => date('Y-m-d H:i:s')]);

            $backtrace = debug_backtrace();
            $trace_methods = [];
            for ($i = 0; $i < 3; $i++) {
                if (isset($backtrace[$i]['function'])) {
                    // Add the function/method name to the front of the array (reverse order)
                    array_unshift($trace_methods, $backtrace[$i]['function']);
                }
            }
            $trace_string = implode(' -> ', $trace_methods);
    
            if($logConsoleWhenTesting) {
                log_custom(LOG_CUSTOM_INFO, 'Fortis Request ' .  json_encode([
                    'trace' => $trace_string,
                    'type' => 'REQUEST',
                    'method' => $method,
                    'url' => $url,
                    'headers' => $request_headers = [
                        'Accept: application/json',
                        'Content-Type: application/json',
                        'developer-id: ####' . substr($this->developerId, -4),  
                        'user-id: ####' . substr($this->userId, -4),            
                        'user-api-key: ####' . substr($this->userApiKey, -4),   
                    ],
                    'payload' => $body
                ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
            }
        }

        if ($method === 'post') {
            curl_setopt($ch, CURLOPT_POST, TRUE);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $bodyString);
        } elseif ($method === 'put') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PUT");
            curl_setopt($ch, CURLOPT_POSTFIELDS, $bodyString);
        } elseif ($method === 'patch') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PATCH");
            curl_setopt($ch, CURLOPT_POSTFIELDS, $bodyString);
        } elseif ($method === 'delete') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "DELETE");
        } elseif ($method === 'get') {
            /* --- Continue! --- */
        }

        $rHeaders = [];
        if ($getFormat == 'html') { 
            curl_setopt($ch, CURLOPT_HEADERFUNCTION, function ($curl, $header) use (&$rHeaders) {
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

            if ($this->testing && IS_DEVELOPER_MACHINE) { //IMPORTANT, DO NOT LOG REQUESTS ON THE SERVER
                
                $this->CI->db->insert('request_logs', ['type' => 'RES', 'headers' => null, 'url' => $url, 'method' => null, 'payload' => $data, 'date' => date('Y-m-d H:i:s')]);
                if($logConsoleWhenTesting) {
                    log_custom(LOG_CUSTOM_INFO, 'Fortis Response ' . json_encode([
                        'type' => 'RESPONSE',
                        'url' => $url,
                        'payload' => json_decode($data)
                    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
                }
            }
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

    public function setMainUserId($userId)
    {
        $this->mainUserId = $userId;
    }

    public function getTesting()
    {
        return $this->testing;
    }

    public function createTransaction($transactionData, $customerData, $paymentData, $fund_data, $productsWithRequest = null, $isAnonymous = false)
    {
        $requestBody = [];
        $requestBody['transaction_amount'] = $paymentData['amount'];
        
        $bank_type = $paymentData['bank_type'];
        $transactionData['created_at']   = date('Y-m-d H:i:s');
        $transactionData['bank_type'] = $bank_type;

        if (isset($customerData['customer']['id'])) {
            $requestBody['client_customer_id'] = $customerData['customer']['id'];
        }
        
        $isTicket = false;
        $endPoint = null;
        if ($paymentData['method'] == 'wallet') {//fortis tokenization used, we save the wallet first, then we use it to pay
            if ($transactionData["src"] == "CC") {
                $endPoint = 'transactions/cc/sale/token';
            } elseif ($transactionData["src"] == "BNK") {
                $endPoint = 'transactions/ach/debit/token';                
            }
            $requestBody['token_id'] = $paymentData['wallet']['wallet_id'];

            $transactionData['request_data'] = $requestBody;
            $transactionData['request_data']['_endPoint']         = $endPoint;
            $transactionData['request_data'] = json_encode($transactionData['request_data']);

        } else {
            if($paymentData['fts_event']->{'@action'} === 'ticket') { //fortis ticket intention, it will be always a CC transaction, we use the ticket and later save the card if the user saved it, after doing the transaction
                $isTicket = true;
                $endPoint = 'transactions/cc/sale/ticket';
                $requestBody['ticket_id'] = $paymentData['fts_event']->id; //ticket id
                $requestBody['save_account'] = $customerData['is_saved'] === 'Y' ? true : false;
                
                $transactionData['request_data'] = $requestBody;
                $transactionData['request_data']['_endPoint']         = $endPoint;

                $transactionData['request_data'] = json_encode($transactionData['request_data']);

            } else if($transactionData["src"] == "BNK") { //serve bank payments from payment links and invoices
                //request performed from frontend, using transaction intention (sale) - validate the transaction with the payment processor, no api call made here.
                if (!isset($paymentData['fts_event']->id)) {//transaction id
                    log_custom(LOG_CUSTOM_INFO, 'Unexpected request! Transaction id not found ' . json_encode(['transactionData' => $transactionData, 'paymentData' => $paymentData]));
                    return ['error' => 1, 'message' => 'Transaction id not found'];
                }
                $ftsTrnxId = $paymentData['fts_event']->id;
                $count = $this->CI->db->where('epicpay_transaction_id', $ftsTrnxId)
                    ->count_all_results(self::TABLE_CUSTOMER_TRX);

                if ($count > 0) {
                    log_custom(LOG_CUSTOM_INFO, 'Unexpected request! Transaction already exist ' . json_encode(['transactionData' => $transactionData, 'paymentData' => $paymentData]));
                    return ['error' => 1, 'message' => 'Transaction already processed'];
                }
                //$result = $this->getTransaction('31efa13439027deebd340691');
                $result = $this->getTransaction($ftsTrnxId);
                if ($result['response']->type === 'Error') {
                    log_custom(LOG_CUSTOM_INFO, 'Error validating transaction ' . json_encode(['transactionData' => $transactionData, 'paymentData' => $paymentData, 'result' => $result]));
                    return ['error' => 1, 'message' => 'Error validating transaction'];
                }
            } else {
                log_custom(LOG_CUSTOM_INFO, 'Unexpected request! Transaction source not found ' . json_encode(['transactionData' => $transactionData, 'paymentData' => $paymentData]));
                return ['error' => 1, 'message' => 'Transaction source not found'];
            }
           
        }

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
        if (isset($transactionData['payment_link_id']) && $transactionData['payment_link_id']) {
            $this->CI->load->model('payment_link_product_paid_model');
            $this->CI->load->model('product_model');

            foreach ($productsWithRequest as $row) {

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

        $requestBody['transaction_c1'] = $this->SYSTEM_LETTER_ID . '-' . $trxId . '-' . date('YmdHis', strtotime($transactionData['created_at']));
        $requestBody['transaction_c2'] = "$trxId";
        
        $response = null;

        if ($paymentData['method'] == 'wallet' || $isTicket) { //ticket is only for credit card             
            $response = $this->_makeCurlRequest($endPoint, $requestBody, 'post');
        } else { //response from payment process from the front end       
            $response = [];
            $response['error'] = 0;
            $response['response'] = new stdClass;
            $response['response']->data = $paymentData['fts_event']; //if the request comes from the front end, we will keep it in memory and process it below                        
        }

        if ($response['error'] == 1 || ($response['error'] == 0 && !isset($response['response']->data->id)) || 
            $response['response']->data->status_code == FORTIS_STATUS_DECLINED || $response['response'] == null) {
            
            $_reason_code = isset($response['response']->data->reason_code_id) ? $response['response']->data->reason_code_id : FALSE;            

            if($_reason_code !== FALSE) {
                $response['response']->data->_reason_message = isset(FORTIS_REASON_CODES[$_reason_code]) ? FORTIS_REASON_CODES[$_reason_code] : '';
            }
            
            $updateData = [
                'request_response' => json_encode($response, JSON_PRETTY_PRINT),
                'epicpay_transaction_id' => isset($response['response']->data->id) ? $response['response']->data->id : null,
                'updated_at'       => date('Y-m-d H:i:s'),
                'status'           => 'N',                
            ];
            
            $response['error']   = 1;

            if ($_reason_code === false) {
                $errorMessage = "An error occurred: Please contact your administrator. ";
                if (isset($response['response']->message)) {
                    $response['message'] = $errorMessage . $response['response']->message;
                } elseif (isset($response['response']) && is_string($response['response'])) {
                    $response['message'] = $errorMessage . $response['response'];
                } elseif(isset($response['response']->detail)) {
                    $response['message'] = $errorMessage . $response['response']->detail;
                } else {
                    $response['message'] = $errorMessage;
                }
            } else {
                $reasonMessage = $response['response']->data->_reason_message ?? null;
                $response['message'] = $reasonMessage
                    ? "An error occurred: $reasonMessage"
                    : "Reason code $_reason_code. Please contact your administrator.";
            }
        } else {

            $updateData = [
                'request_response'       => json_encode($response, JSON_PRETTY_PRINT),
                'epicpay_transaction_id' => isset($response['response']->data->id) ? $response['response']->data->id : null,
                'updated_at'             => date('Y-m-d H:i:s'),
                'status'                 => 'P',
                'status_ach'             => $transactionData["src"] == "BNK" ? 'W' : null,  
                'fts_status_id'          => $response['response']->data->status_code, //saved for cc and ach, however we are using it for tracking ACH changes, for now
                'transaction_batch_id'     => $transactionData["src"] == "CC" ? $response['response']->data->transaction_batch_id : null,
            ];

            
            $response['error'] = 0;

            if (!$isAnonymous) {
                $donationAcumData = [
                    'id'          => $transactionData['account_donor_id'],
                    'amount_acum' => $transactionData['total_amount'],
                    'fee_acum'    => $transactionData['fee'],
                    'net_acum'    => $transactionData['sub_total_amount']
                ];
                $this->CI->donor_model->updateDonationAcum($donationAcumData);
            }
            
            if($isTicket) {// ticket only when the transaction is from a credit card
                $updateData['src_account_type'] = $response['response']->data->account_type; //save the brand of the card in the transaction record
                if(isset($response['response']->data->saved_account->id)) { //means the card/customer needs to be saved
                    $paymentData['wallet_id'] = $response['response']->data->saved_account->id;
                    $paymentData['account_holder_name'] = $response['response']->data->saved_account->account_holder_name;
                    $paymentData['card_exp_date'] = $response['response']->data->saved_account->exp_date;
                    $paymentData['src_account_type'] = $response['response']->data->saved_account->account_type;
                    $paymentData['last_digits'] = $response['response']->data->saved_account->last_four;
                    $paymentData['created_user_id'] = $response['response']->data->saved_account->created_user_id;

                    $this->createCustomer($customerData, $paymentData);
                }
                
            }        
        }

        $this->CI->db->update(self::TABLE_CUSTOMER_TRX, $updateData, ['id' => $trxId]);

        if($customer_subscription_id) { //if error or not error send subscription webhook
            $this->CI->load->model('subscription_model');
            // Calculate and save subscription status before sending webhook
            $this->CI->subscription_model->updateSubscriptionStatus($customer_subscription_id);
            $subscriptionDataWh = $this->CI->subscription_model->getById($customer_subscription_id);
            $this->CI->subscription_model->update($customer_subscription_id, ['webhook_closed' => 0]);
            $this->sendSubscriptionWebhook($transactionData['church_id'], (array) $subscriptionDataWh, 'subscription_updated');
        }

        if($response['error'] === 0) {

            //create a pdf receipt only if the transaction is succeded.
            //createReceiptPdf needs an updated record of the transaction,
            $this->CI->load->model('donation_model');
            $updateDataReceipt['receipt_file_uri_hash'] = $this->CI->donation_model->createReceiptPdf($trxId);
            
            //then we update self::TABLE_CUSTOMER_TRX again with the receipt_file_uri_hash only
            $this->CI->db->update(self::TABLE_CUSTOMER_TRX, $updateDataReceipt, ['id' => $trxId]);
        }

        $response["trxId"] = $trxId;
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

    public function createSubscription($transactionData, $customerData, $paymentData, $fund_data, $paymentLink = false)
    {

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
            'next_payment_on'         => date('Y-m-d 23:59:59', strtotime($paymentData['next_payment_date'])),
            'trial_days'              => $paymentData['trial_days'],
            'amount'                  => $transactionData['total_amount'],
            'account_donor_id'        => $transactionData['account_donor_id'],
            'first_name'              => $transactionData['first_name'],
            'last_name'               => $transactionData['last_name'],
            'email'                   => $transactionData['email'],
            //'zip'                     => $paymentData['wallet']['postal_code'],
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
            //'ispaysafe'               => 1,
            //save the payment_link_product.ID as reference of the product linked to the subscription | always expecting one record inside the array
            'payment_link_products_id' => $paymentLink ? $paymentLink->_products_with_request[0]->id : null,
            'white_label_tag'          => isset($transactionData['white_label_tag']) && $transactionData['white_label_tag'] ? $transactionData['white_label_tag'] : null
            //'request_data'       => $transactionData['request_data']
        ];

        $subscriptionData['created_at'] = date('Y-m-d H:i:s');

        $this->CI->db->insert(self::TABLE_CUSTOMER_SUBS, $subscriptionData);
        $subId                          = $this->CI->db->insert_id();
        
        $today             = date('Y-m-d');        
        $subscriptionData['id'] = $subId; // Add subscription_id to subscriptionData for webhook
        
        $this->CI->load->model('subscription_model');
        
        // Calculate and save subscription status before sending webhook
        $this->CI->subscription_model->updateSubscriptionStatus($subId, $creation = true);
        $subscriptionDataWh = $this->CI->subscription_model->getById($subId);
        $this->sendSubscriptionWebhook($transactionData['church_id'], (array) $subscriptionDataWh, 'subscription_created');
        
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

        // --- When payment link request: products must be saved as a log of the payment, products quantities and prices are variable but the payment 
        // --- must be saved as a snapshot
        if ($paymentLink) {
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
        
        //Do not trigger the transaction in CUSTOM products whose first payment is not of the day 
        if ($paymentData['frequency'] == 'Custom' && $paymentData['next_payment_date'] > $today) {
            //verifyx payment done?
            $response['payment_info'] = ['payment_done' => true, 'trxn_id' => null];

            return $response;
        } 
        if($subscriptionData['trial_days'] && $subscriptionData['trial_days'] > 0) {
            $response['message'] = 'Trial subscription created successfully';
            $response['payment_info'] = [
                'payment_done' => false, 
                'trxn_id' => null, 
                'subscription_id' => $subId, 
                'status' => 'success',
                'type' => 'trial',                
                'payment_reponse' => null
            ];

            return $response;
        } 
        //manually pull the subscription/payment trigger only for the current subscription
                
        // - The request is made from inside the Docker container.
        // - Since the container uses port 80 internally, we need to call 'http://localhost' without specifying the port.
        // - This ensures the container can correctly reach the app via its internal network.
        $cronEndpoint = 'http://localhost/fortiscron/process_recurrent_transactions/' . $subId;                
        
        $token = CRON_AUTH_TOKEN; // Replace with your actual token
        $options = [
            'http' => [
                'header' => "Authorization: Bearer $token\r\n",
                'method' => 'GET',
            ]
        ];

        $context = stream_context_create($options);
        $subPaymentResponse = file_get_contents($cronEndpoint, false, $context);
        $subPaymentResponseObj = json_decode($subPaymentResponse);

        if (!isset($subPaymentResponseObj->summary) || !$subPaymentResponseObj->summary) {
            
            $response['error'] = 1;
            $response['message'] = 'Error while attempting to process the transaction (PRC fail). ' . 'Sub: ' . $subId . '';
            log_custom(LOG_CUSTOM_ERROR, 'ERROR FROM process_recurrent_transactions (PRC fail). ' . $subPaymentResponse);
            unset($subPaymentResponseObj->summary);
            $response['payment_info'] = [
                'payment_done' => true, 
                'trxn_id' => null, 
                'subscription_id' => $subId, 
                'status' => 'failed',
                'type' => 'starts_today',
                'payment_reponse' => $subPaymentResponseObj
            ];

            $this->CI->db->where('id', $subId)
                ->update(self::TABLE_CUSTOMER_SUBS, ['status' => 'D']);

            return $response;
            
        } 
        
        if($subPaymentResponseObj->summary->count) {
            
            if (count($subPaymentResponseObj->summary->subs_success) == 1) {
                $response['message']      = 'Payment processsed';
                $trxn_id                  = $subPaymentResponseObj->summary->subs_success[0]->trxn_id;   
                
                unset($subPaymentResponseObj->summary);
                $response['payment_info'] = [
                    'payment_done' => true, 
                    'trxn_id' => $trxn_id,                     
                    'status' => 'success',
                    'type' => 'starts_today',
                    'subscription_id' => $subId,
                    'payment_reponse' => $subPaymentResponseObj
                ];
            } else if (count($subPaymentResponseObj->summary->subs_failed) == 1) {
                
                $response['error'] = 1;                
                $trxn_id                  = $subPaymentResponseObj->summary->subs_failed[0]->trxn_id;                    
                $response['message']      = 'Error while attempting to process the transaction. ' . 'Sub: ' . $subId . ' Trxn: ' . $trxn_id;
                log_custom(LOG_CUSTOM_ERROR, 'Error while attempting to process the transaction. ' . 'Sub: ' . $subId . ' Trxn: ' . $trxn_id);

                unset($subPaymentResponseObj->summary);
                $response['payment_info'] = [
                    'payment_done' => false, 
                    'trxn_id' => $trxn_id,                     
                    'status' => 'failed',
                    'type' => 'starts_today',
                    'subscription_id' => $subId,
                    'payment_reponse' => $subPaymentResponseObj
                ];
                //        $this->CI->db->insert(self::TABLE_CUSTOMER_SUBS, $subscriptionData);
                
                $this->CI->db->where('id', $subId)
                    ->update(self::TABLE_CUSTOMER_SUBS, ['status' => 'D']);
            } 
        } else {
            // Subscription created without a trial.
            // A future payment date was set by the customer — it will be processed on that date.
            $response['message'] = 'Payment on future date';
            
            $response['payment_info'] = [
                'payment_done' => false, 
                'trxn_id' => null, 
                'subscription_id' => $subId,
                'status' => 'success',
                'type' => 'starts_future_customer_defined',
                'payment_reponse' => $subPaymentResponseObj
            ];
        }
        return $response;
    }

    //========== creates a new customer with a source, if the customer exists it adds the source only
    public function createCustomer($customerData, $paymentData)
    {        
        
        if (!isset($customerData['customer_address'])) { //check this we can remove it? verifyx
            return ['error' => 1, 'message' => 'The customer address is required'];
        }

        $customerExists = false;
        $dbCustomer     = null;        
        $customerId     = null;

        if ($customerData['account_donor_id']) {
            $dbCustomer = $this->CI->db->where('account_donor_id', $customerData['account_donor_id'])
            ->where('church_id', $customerData['church_id'])
            ->where('status', 'P')
                ->order_by('id', 'desc')
                ->get(self::TABLE_CUSTOMERS)->row();

            if ($dbCustomer) {
                $customerExists = true;
                $customerId     = $dbCustomer->id;
            }
        }

        //update the donor profile with the first and last name if it is empty
        $this->CI->load->model('donor_model');        
        $donor = $this->CI->donor_model->get($customerData['account_donor_id'], 'first_name');        
        if($donor->first_name === null || $donor->first_name === "") {            
            $update_customer_data = [
                'id'         => $customerData['account_donor_id'],
                'first_name' => $customerData['customer_address']['first_name'],
                'last_name'  => $customerData['customer_address']['last_name'],            
                'updated_at' => date('Y-m-d H:i:s'),
            ];
            $this->CI->donor_model->update_profile($update_customer_data, $this->mainUserId);
        }
        ///////        
        
        if (!$customerExists) {            
            $this->CI->db->insert(self::TABLE_CUSTOMERS, [
                'email'                 => $customerData['customer_address']['email'],
                'first_name'            => $customerData['customer_address']['first_name'],
                'last_name'             => $customerData['customer_address']['last_name'],
                'church_id'             => $customerData['church_id'],
                'account_donor_id'      => $customerData['account_donor_id'],                
                'epicpay_customer_id'   => $paymentData['created_user_id'],
                'status'                => 'P',
                'created_at'            => date('Y-m-d H:i:s'),
                'updated_at'            => date('Y-m-d H:i:s'),
            ]);

            $customerId = $this->CI->db->insert_id();
        }
        
        $walletId        = $paymentData['wallet_id'];
        $nameHolder      = $paymentData['account_holder_name'];

        $exp_month = null;
        $exp_year  = null;
        $src_account_type = null; //visa, mc etc ..
        
        if($customerData['is_saved']) {
            if($paymentData['method'] == 'credit_card') {
                $exp_month = substr($paymentData['card_exp_date'], 0, 2);
                $exp_year = substr($paymentData['card_exp_date'], 2, 2);
            }
            
            $src_account_type = $paymentData['src_account_type'];
        }

        $this->CI->db->insert(self::TABLE_CUSTOMER_SOURCES, [
            'customer_id'                => $customerId,
            'church_id'                  => $customerData['church_id'],
            'account_donor_id'           => $customerData['account_donor_id'],
            'source_type'                => $paymentData['method'] == 'credit_card' ? 'card' : 'bank',
            'bank_type'                  => isset($paymentData['bank_type']) ? $paymentData['bank_type'] : null,
            'last_digits'                => $paymentData['last_digits'] ?? null,
            'name_holder'                => $nameHolder,
            'epicpay_wallet_id'          => $walletId,
            'epicpay_customer_id'        => $paymentData['created_user_id'],
            'is_active'                  => 'Y',
            'is_saved'                   => $customerData['is_saved'],
            'status'                     => 'P',
            'exp_month'                  => $exp_month,
            'exp_year'                   => $exp_year,
            'src_account_type'          => $src_account_type,
            'postal_code'                => $customerData['customer_address']['postal_code'],
            'request_response'           => json_encode($paymentData['fts_event']),
            'created_at'                 => date('Y-m-d H:i:s'),
            'updated_at'                 => date('Y-m-d H:i:s'),
        ]);


        $customerSourceId     = $this->CI->db->insert_id();
        $response['customer'] = ['id' => $customerId, 'epicpay_id' => $paymentData['created_user_id']];
        $response['source']   = ['id' => $customerSourceId, 'epicpay_id' => $walletId, 'postal_code' => null];
        $response['error'] = 0;
        return $response;
        
        
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

    public function deleteCustomerSource($source_id, $donor_id)
    {

        $this->CI->load->model('sources_model');
        $source = $this->CI->sources_model->getOne($donor_id, $source_id, ['id', 'church_id', 'epicpay_customer_id', 'epicpay_wallet_id', 'paysafe_source_id', 'source_type', 'bank_type'], true);

        if (!$source) {
            return ['error' => 1, 'message' => 'Invalid source'];
        }

        $response = $this->_makeCurlRequest('tokens/' .  $source->epicpay_wallet_id, null, 'delete');

        $updateData['response_delete'] = json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

        if ($response['error'] == 1 || ($response['error'] == 0 && isset($response['response']->type) && $response['response']->type == 'Error')) {
            $response['error']   = 1;
            $response['message'] =
                isset($response['response']->meta->message)
                ? $response['response']->meta->message : (isset($response['response']->detail)
                    ? ($response['response']->detail) : 'Unknown error. Please contact your administrator');
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

    public function stopCustomerSubscription($subscriptionId, $user_id = false, $donor_id = false, $sendWehook = true)
    {

        if ($user_id) {
            $result = checkBelongsToUser([
                ['epicpay_customer_subscriptions.id' => $subscriptionId, 'church_id', 'church_detail.ch_id'],
                ['church_detail.ch_id' => '?', 'client_id', 'users.id', $user_id],
            ]);
            if ($result !== true) {
                return $result;
            }
            $subscription = $this->CI->db->where('id', $subscriptionId)->get(self::TABLE_CUSTOMER_SUBS)->row();
        } else if ($donor_id) {
            $subscription = $this->CI->db->where('id', $subscriptionId)->where('account_donor_id', $donor_id)->get(self::TABLE_CUSTOMER_SUBS)->row();
        } else {
            $subscription = $this->CI->db->where('id', $subscriptionId)->get(self::TABLE_CUSTOMER_SUBS)->row();
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

        if($sendWehook){
            $this->CI->load->model('subscription_model');
            // Calculate and save subscription status before sending webhook
            $this->CI->subscription_model->updateSubscriptionStatus($subscriptionId);
            $subscriptionDataWh = $this->CI->subscription_model->getById($subscriptionId);
            $this->sendSubscriptionWebhook($subscription->church_id, (array) $subscriptionDataWh, 'subscription_updated');    
        }        
       
        return $response;
    }

    /**
     * Send webhook for subscription created event
     */
    private function sendSubscriptionWebhook($church_id, $subscription_data, $webhook_type)
    {
        try {
            // Get client_id from church_id
            $this->CI->load->model('organization_model');
            $organization = $this->CI->organization_model->get($church_id);
            
            if (!$organization || !$organization->client_id) {
                log_custom(LOG_CUSTOM_ERROR, "Could not find client_id for church_id: $church_id");
                return false;
            }

            $this->CI->load->library('WebhookService');
            $webhookService = new WebhookService();
            
            return $webhookService->sendSubscription($organization->client_id, $subscription_data, $webhook_type);
            
        } catch (Exception $e) {
            log_custom(LOG_CUSTOM_ERROR, "Error sending subscription created webhook: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get plan name from subscription data
     */
    public function getPlanType($payment_link_products_id)
    {        
            
        $this->CI->load->model('product_model');
        $this->CI->load->model('payment_link_product_model');
        $pl_product = $this->CI->payment_link_product_model->get($payment_link_products_id);

        $productId = $pl_product->product_id;

        $product = $this->CI->product_model->get($productId, null, true);
        
        if ($product && $product->plan_type) {
            // Use the plan_type as the plan name
            return strtolower(trim($product->plan_type));
        }

        // Use the product name as the plan name
        return strtolower(trim($product->name));
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

    public function refundTransaction($trxId)
    {
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

        if ($transaction->src == "CC") {            
            $requestBody                  = [
                'transaction_amount'           => (int) ((string) ($transaction->total_amount * 100)),
            ];
            
            $response                     = $this->_makeCurlRequest('transactions/' .  $transaction->epicpay_transaction_id . '/refund', $requestBody, 'patch');
            
            
        } elseif ($transaction->src == "BNK") {
            $requestBody                  = [
                'transaction_amount'           => (int) ((string) ($transaction->total_amount * 100)),
            ];
            
            $response                     = $this->_makeCurlRequest('transactions/' .  $transaction->epicpay_transaction_id . '/refund', $requestBody, 'patch');
        }
        //

        $refundData['refund_request'] = json_encode($requestBody, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        $refundData['refund_response'] = json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

        if ($response['error'] == 1 || ($response['error'] == 0 && isset($response['response']->type) && $response['response']->type == 'Error' || !isset($response['response']->data->id))) { 
            
            $response['error']   = 1;            
            $response['message'] = isset($response['response']->detail) ? ($response['response']->detail) : 'Unknown error. Please contact your administrator';
        } else {

            $refundData['status'] = 'P';
            $refundData['epicpay_transaction_id'] = $response['response']->data->id;
            $refundData['fts_status_id'] = $response['response']->data->status_code;
            $refundData['transaction_batch_id'] = $transaction->src == "CC" ? $response['response']->data->transaction_batch_id : null;

            if($transaction->src === 'BNK') {
                $refundData['status_ach'] = 'W';
            }

            $this->CI->load->model('donor_model');
            $donationAcumData  = [
                'id'          => $refundData['account_donor_id'],
                'amount_acum' => $refundData['total_amount'],
                'fee_acum'    => 0, //refund does recover the paid fee
                'net_acum'    => $refundData['sub_total_amount'],
            ];
            $this->CI->donor_model->updateDonationAcum($donationAcumData);
            $response['error'] = 0;
        }

        $refundData['updated_at'] = date('Y-m-d H:i:s');
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

    //set as failed works the same as refunded but it does not call fortis
    public function setAsFailed($trxId)
    {
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

    public function processUpdateWallet($source, $request)
    {

        $billingAddress = $request['billingAddress'];

        $responseAddress = $this->_makeCurlRequest('customervault/v1/profiles/' . $source->epicpay_customer_id . '/addresses', $billingAddress, 'post');

        if ($responseAddress['error'] == 1 || ($responseAddress['error'] == 0 && isset($responseAddress['response']->error))) {
            //===== error 
            $responseAddress['error']   = 1;
            $responseAddress['message'] = isset($responseAddress['response']->error->message) ? $responseAddress['response']->error->message : 'Unknown error. Please contact your administrator';

            return $responseAddress;
        }

        //Convert 2 digits year to 4 digits year
        if (strlen($request["cardExpiry"]["year"]) == 2) {
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
    public function verification($data)
    {

        $response = $this->_makeCurlRequest('cardpayments/v1/accounts/' . $data['account_id'] . '/verifications', $data['payload'], 'post');
        return $response;
    }

    public function authorize($data)
    {

        $response = $this->_makeCurlRequest('cardpayments/v1/accounts/' . $data['account_id'] . '/auths', $data['payload'], 'post');
        return $response;
    }

    private function ipIsBlackListed($ip)
    {
        $reg = $this->CI->db->where('ip', $ip)->where('status', '1')->order_by('id', 'desc')->get('giving_blacklisted_ips')->row();
        if ($reg) {
            $response['error']   = 1;
            $response['message'] = 'Please contact your administrator, error 9972';
            return $response;
        }
        return false;
    }

    private function checkCardTesting($transactionData)
    {

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

    public function processTwilioRequest()
    {
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

    private function _twilioGetFunds($churchId)
    {
        $this->CI->load->model('fund_model');
        $resultObj = true;
        $funds     = $this->CI->fund_model->getListSimple($churchId, null, $resultObj);
        return $funds;
    }

    private function _twilioGetSourceText($accountDonorId, $churchObj)
    {
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

    private function _twilioGetSources($accountDonorId)
    {
        $this->CI->load->model('sources_model');
        $orderBy   = false;
        $resultObj = true;
        return $this->CI->sources_model->getList($accountDonorId, $orderBy, $resultObj, ['id', 'source_type', 'epicpay_wallet_id', 'last_digits']);
    }

    private function _twilioUpdateTrx($trxId, $data)
    {
        $this->CI->db->where('id', $trxId)->update(self::TABLE_MOBILE_TRX, $data);
    }

    private function _twilioProcessTrx($trxId)
    {
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