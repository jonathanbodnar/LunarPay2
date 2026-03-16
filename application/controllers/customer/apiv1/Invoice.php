<?php

defined('BASEPATH') or exit('No direct script access allowed');

require_once 'application/controllers/customer/apiv1/utils/helper.php';

class Invoice extends CI_Controller
{

    private $session_id         = null;
    private $is_session_enabled = false;

    public function __construct()
    {

        parent::__construct();

        $this->load->model('api_session_model');
        $this->load->library('widget_api_202107');

        $action = $this->router->method;

        /* ------- NO ACCESS_TOKEN METHODS ------- */
        $free = ['get_settings', 'setup', 'is_logged']; //method some times needs token validation
        /* ------- ---------------- ------ */

        allow_cors(['http://localhost:5183', 'http://localhost:3000', 'https://app.leads.biz', 'https://shoutout.us', BASE_URL]); 
        
        //restrict endpoint when method/action is not in the free array OR
        if (!in_array($action, $free)) {

            if ($action == 'index') {
                // ========== CONTINUE - IT'S FREE =========
            } else { //restrict - validate access token, if it does not match cut the flow
                $result = $this->widget_api_202107->validaAccessToken();
                if ($result['status'] === false) {
                    output_json_custom($result);
                    die;
                }
                $this->is_session_enabled = true;
                $this->session_id         = $result['current_access_token'];
            }
        }
    }

    //get
    public function index($hash = 0)
    {
        try {
            $this->load->model('invoice_model');
            $this->invoice_model->valAsArray = true;
            $invoice = $this->invoice_model->getByHash($hash);

            if (!$invoice) {
                output_json_api([
                    'invoice' => $invoice,
                ], 0, REST_Controller_Codes::HTTP_OK);
                return;
            }

            require_once 'application/controllers/extensions/Payments.php';
            $orgnx_id = $invoice->church_id;

            $this->load->model('organization_model');
            $this->load->model('user_model');
            $orgnx = $this->organization_model->get($orgnx_id, ['client_id']);
            $mainUser = $this->user_model->get($orgnx->client_id, ['payment_processor']);
            $payment_processor = $mainUser->payment_processor;

            $envObj = Payments::getEnvironment($payment_processor, $orgnx_id);
            
            $env = null;
            $encodedKeys = null;
            if ($envObj['envTest']) {
                $env = 'TEST';
                if ($payment_processor == PROVIDER_PAYMENT_PAYSAFE_SHORT) {
                    $encodedKeys = base64_encode(PAYSAFE_SINGLE_USE_API_KEY_USER_TEST . ':' . PAYSAFE_SINGLE_USE_API_KEY_PASS_TEST);
                } 
            } else {
                $env = 'LIVE';
                if ($payment_processor == PROVIDER_PAYMENT_PAYSAFE_SHORT) {
                    $encodedKeys = base64_encode(PAYSAFE_SINGLE_USE_API_KEY_USER_LIVE . ':' . PAYSAFE_SINGLE_USE_API_KEY_PASS_LIVE);
                } 
                
            }

            $this->load->helper('crypt');

            $customerHubUrl = IS_DEVELOPER_MACHINE
                ? BASE_URL . 'customer-hub/' . $orgnx_id
                : BASE_URL . 'customer-hub/' . merchantSlugEncode($orgnx_id);

            output_json_api([
                'invoice'            => $invoice,
                'payment_processor' => [
                    'code'         => $payment_processor,
                    'env'          => $env,
                    'encoded_keys' => $encodedKeys,
                    'pricing_tpl'     => isset($envObj['pricing_tpl']) ? $envObj['pricing_tpl'] : null,                    
                ],
                'customer_hub_url' => $customerHubUrl
            ], 0, REST_Controller_Codes::HTTP_OK);
        } catch (Exception $ex) {
            output_json_api(['errors' => [$ex->getMessage()]], 1, REST_Controller_Codes::HTTP_BAD_REQUEST);
        }
    }

    public function get_all_by_customer()
    {
        try {
            $this->load->model('invoice_customer_model');
            $this->invoice_customer_model->valAsArray = true;

            $sessionData = $this->api_session_model->getSessionData($this->session_id);
            $customerId = $sessionData['user_id'];

            $invoices = $this->invoice_customer_model->getInvoices($customerId);
            output_json_api(['status' => true, 'invoices' => $invoices], 0, REST_Controller_Codes::HTTP_OK);
            
        } catch (Exception $ex) {
            output_json_api(['errors' => [$ex->getMessage()]], 1, REST_Controller_Codes::HTTP_BAD_REQUEST);
        }
    }
}
