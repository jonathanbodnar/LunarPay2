<?php

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

require_once 'application/libraries/gateways/PaymentsProvider.php';

class Fortiswebhooks extends CI_Controller
{

    protected $env; //environment
    function __construct()
    {
        parent::__construct();
        display_errors();

        $this->env = $_ENV['fortis_environment'];
    }

    private function output($status, $errorCode, $message, $meta = null)
    {
        http_response_code($errorCode);

        header('Content-type: application/json');
        echo json_encode([
            'status'    => $status,
            'http_code' => $errorCode,
            'message'   => $message,
            'meta'      => $meta,
        ]);
    }

    public function merchant_account_status_listener()
    {
        $clientIp = get_client_ip_from_trusted_proxy();
        log_custom(LOG_CUSTOM_INFO, "merchant_account_status_listener [SYSTEM - " . BASE_URL . "] Client IP: $clientIp " . date("Y-m-d H:i:s"));

        $fullRequest = $this->captureFullRequest('merchant_account_status_listener');

        // Check if the request method is POST
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            log_custom(LOG_CUSTOM_INFO, "merchant_account_status_listener Method not allowed ");
            $this->output(false, 405, 'Method not allowed');
            return;
        }

        $input_json = @file_get_contents('php://input');
        $input      = json_decode($input_json);


        $this->db->insert('fortis_webhooks', [
            'type'           => 'onboard',
            'event_json'     => $input_json,
            'mode'           => $this->env,
            'full_request'   => $fullRequest,
            'created_at'     => date('Y-m-d H:i:s'),
        ]);

        if (!isset($input->client_app_id) || empty($input->client_app_id)) {
            log_custom(LOG_CUSTOM_INFO, "merchant_account_status_listener client_app_id not provided " . date("Y-m-d H:i:s"));
            $this->output(false, 400, 'client_app_id not provided');
            return;
        }

        $client_app_id = $input->client_app_id;

        $this->sendNotificationToAdmin($input);

        $this->load->model('organization_model');
        $organization = $this->organization_model->get($client_app_id);

        $this->load->model('orgnx_onboard_fts_model');
        $this->orgnx_onboard_fts_model->secure_check = false;
        $account       = $this->orgnx_onboard_fts_model->getByOrg($client_app_id);

        if (!$account) {
            $this->output(false, 404, 'Merchant account not found!');
            return;
        }

        $userId = null;
        $userApiKey = null;

        if (isset($input->users) && is_array($input->users) && count($input->users) > 0) {
            $userId = $input->users[0]->user_id;
            $userApiKey = $input->users[0]->user_api_key;
            $locationId = $input->location_id;

            $ccProductTransactionId = null;
            $achProductTransactionId = null;

            foreach ($input->product_transactions as $product_transaction) {
                switch (strtolower($product_transaction->payment_method)) {
                    case 'cc':
                        $ccProductTransactionId = $product_transaction->id;
                        break;
                    case 'ach':
                        $achProductTransactionId = $product_transaction->id;
                        break;
                }
            }

            if(true && $account->app_status == 'ACTIVE') {
                $this->output(false, 400, 'The merchant is already active! no changes were made');
                return;
            }

            PaymentsProvider::init(PROVIDER_PAYMENT_FORTIS);
            $PaymentInstance    = PaymentsProvider::getInstance();
            $encriptionDetails = $PaymentInstance->getEncryptDetails();

            $this->load->library('encryption');
            $this->encryption->initialize($encriptionDetails);

            $credentials = $this->encryption->encrypt(json_encode([
                'user_id' => $userId,
                'user_api_key' => $userApiKey
            ]));

            $saveDataFts = [
                'id' => $account->id,
                'credentials' => $credentials,
                'location_id' => $locationId,
                'cc_product_transaction_id' => $ccProductTransactionId,
                'ach_product_transaction_id' => $achProductTransactionId,
                'app_status' => 'ACTIVE'
            ];

            $this->orgnx_onboard_fts_model->update($saveDataFts); //set credentials uses the saved credentials so we nee to update here then the ach_webhook_resp_status

            // Creating two webhooks for receiving cc and ach transactions status
            $PaymentInstance->setAgentCredentials($client_app_id); 
            $whResp = $PaymentInstance->createTransactionWebhook($locationId, $achProductTransactionId, $client_app_id, 'ach');

            $saveWhData = [
                'id' => $account->id,
                'ach_webhook_resp_status' => json_encode($whResp, JSON_PRETTY_PRINT)
            ];
            
            $this->orgnx_onboard_fts_model->update($saveWhData);

            //////////////////////////////////////////

            $this->sendEmailNotificationToMerchant($account, $organization);

            $this->output(true, 200, 'Success!', [$whResp]);

            return;
        } else {
            $this->output(false, 400, 'We expect at least one user with credentials!');
            return;
        }
    }

    public function ach_transaction_listener($client_app_id = null)
    {

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            log_custom(LOG_CUSTOM_INFO, "ach_transaction_listener Method not allowed ");
            $this->output(false, 405, 'Method not allowed');
            return;
        }

        if (empty($_SERVER['PHP_AUTH_USER']) || empty($_SERVER['PHP_AUTH_PW'])) {
            $this->output(false, 401, 'Unauthorized access');
            return;
        }

        $validUsername = $_ENV['fortis_transaction_webhook_basic_auth_username'] ?? '';
        $validPassword = $_ENV['fortis_transaction_webhook_basic_auth_password'] ?? '';

        if (
            $_SERVER['PHP_AUTH_USER'] !== $validUsername ||
            $_SERVER['PHP_AUTH_PW'] !== $validPassword
        ) {
            $this->output(false, 401, 'Unauthorized access');
            return;
        }


        $input_json = @file_get_contents('php://input');
        $input      = json_decode($input_json);

        $this->db->insert('fortis_webhooks', [
            'type' => 'ach_transaction',
            'event_json' => $input_json,
            'meta'       => json_encode(['client_app_id' => $client_app_id]),
            'mode'      => $this->env,
            'created_at' => date('Y-m-d H:i:s'),
        ]);

        if (!$client_app_id) {
            log_custom(LOG_CUSTOM_INFO, "ach_transaction_listener client_app_id not provided ");
            $this->output(false, 400, 'bad request client_app_id not provided');
            return;
        }

        if (!isset($input->resource) || !isset($input->type)) {
            log_custom(LOG_CUSTOM_INFO, "ach_transaction_listener resource or type not provided");
            $this->output(false, 400, 'bad request resource or type not provided');
            return;
        }

        $data = json_decode($input->data);

        if (!isset($data->status_id)) {
            log_custom(LOG_CUSTOM_INFO, "ach_transaction_listener status_id not provided");
            $this->output(false, 400, 'bad request status_id not provided');
            return;
        }

        $transaction_id = $data->id;
        $status_id = $data->status_id;

        $this->load->model('organization_model');
        $organization = $this->organization_model->get($client_app_id);

        if (!$organization) {
            log_custom(LOG_CUSTOM_INFO, "ach_transaction_listener organization not found");
            $this->output(false, 404, 'bad request organization not found');
            return;
        }

        $this->load->model('donation_model');
        $trxn = $this->donation_model->get_transaction_by_fts_id($client_app_id, $transaction_id);
        if (!$trxn) {
            log_custom(LOG_CUSTOM_INFO, "ach_transaction_listener transaction not found");
            $this->output(false, 404, 'bad request transaction not found');
            return;
        }

        $this->donation_model->update_fts_transaction_status($client_app_id, $transaction_id, $status_id);

        $this->output(true, 200, 'Success!', ['transaction_id' => $transaction_id, 'status_id' => $status_id]);
    }

    private function maskExceptLast3($str) {
        if (!$str || strlen($str) <= 3) {
            // If string is empty or too short, just return as is
            return $str;
        }
        $len = strlen($str);
        return str_repeat('#', 5) . substr($str, -2);
    }
    
    private function sendNotificationToAdmin($input)
    { //just sending an email as notification and knowledge to an admin 

        if (defined('PAYSAFE_MIRRORED_SYSTEMS_I_AM_THE_MAIN_SYSTEM') && PAYSAFE_MIRRORED_SYSTEMS_I_AM_THE_MAIN_SYSTEM) {

            $inputCopy = clone $input;

            if (isset($inputCopy->users[0]->user_id)) {
                $inputCopy->users[0]->user_id = $this->maskExceptLast3($inputCopy->users[0]->user_id);
            }
            
            if (isset($inputCopy->users[0]->user_api_key)) {
                $inputCopy->users[0]->user_api_key = $this->maskExceptLast3($inputCopy->users[0]->user_api_key);
            }
            
            unset($inputCopy->product_transactions);

            $this->load->helper('admin_notifier');
            AdminNotifier::onOnboardWebhookReceived($inputCopy, ['juan@lunarpay.io']);            
        }
    }

    private function sendEmailNotificationToMerchant($account, $organization)
    {

        $this->load->use_theme();

        $message = $this->load->view('email/fts_account_active', [
            'merchant_name'  => $organization->church_name,
        ], TRUE);

        $from = $this->config->item('admin_email', 'ion_auth');
        $to   = $account->email;

        $subject = FORTIS_EMAIL_SUBJECT_MERCHANT_ACCOUNT_ACTIVE;

        require_once 'application/libraries/email/EmailProvider.php';        
        EmailProvider::getInstance()->sendEmail($from, COMPANY_NAME, $to, $subject, $message);
    }

    private function captureFullRequest($detail)
    {

        $requestMethod = $_SERVER['REQUEST_METHOD'];

        $headers = get_headers_safe();

        // Capture the raw POST body (if the method is POST)
        $rawPostData = file_get_contents('php://input');

        $package = [
            'dataRaw' => $rawPostData,
        ];

        // Capture the full URL (optional)
        $requestUri = $_SERVER['REQUEST_URI'];
        $serverName = $_SERVER['SERVER_NAME'];
        $fullUrl = "https://$serverName$requestUri";

        // Prepare the data to be written to the file
        $requestData = [
            'method' => $requestMethod,
            'url' => $fullUrl,
            'headers' => $headers,
            'package' => $package,
            'timestamp' => date('Y-m-d H:i:s'),
        ];

        // Convert the data to JSON format
        $jsonData = json_encode($requestData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

        return $jsonData;
    }
}
