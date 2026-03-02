<?php

defined('BASEPATH') OR exit('No direct script access allowed');

require_once 'application/controllers/customer/apiv1/utils/helper.php';

class Payment_link extends CI_Controller {

    private $session_id = null;

    public function __construct() {

        parent::__construct();

        $this->load->model('api_session_model');
        $this->load->library('widget_api_202107');

        $action = $this->router->method;

        /* ------- NO ACCESS_TOKEN METHODS ------- */
        $free = ['']; //methods needs token validation
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
                $this->session_id = $result['current_access_token'];
            }
        }
    }

    //get payment link and associations
    public function index($hash = 0) {
        try {
            $this->load->model('payment_link_model');
            $this->load->model('product_model');
            
            $this->payment_link_model->valAsArray = true;
            $paymentLink = $this->payment_link_model->getByHash($hash);

            if(!$paymentLink) {
                output_json_api([
                    'payment_link' => $paymentLink,
                ], 0, REST_Controller_Codes::HTTP_OK);
                return;
            }
            
            //Remove Digital Contents
            foreach ($paymentLink->products as $product){
                $product->digital_content = null;
                $product->digital_content_url = null;
            }

            require_once 'application/controllers/extensions/Payments.php';
            $orgnx_id = $paymentLink->church_id;

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
                'payment_link'      => $paymentLink,
                'var_config'        => ['product_model' => $this->product_model->getConstants()],
                'payment_processor' => [
                    'code'         => $payment_processor,
                    'env'          => $env,
                    'encoded_keys' => $encodedKeys,
                    'pricing_tpl'     => isset($envObj['pricing_tpl']) ? $envObj['pricing_tpl'] : null
                ],
                'customer_hub_url' => $customerHubUrl
            ], 0, REST_Controller_Codes::HTTP_OK);

        } catch (Exception $ex) {
            output_json_api(['errors' => [$ex->getMessage()]], 1, REST_Controller_Codes::HTTP_BAD_REQUEST);
        }
    }

    //create from customer
    public function create() {
        try {
            $input_json = @file_get_contents('php://input');
            $input      = json_decode($input_json, true);
            
            $sessionData = $this->api_session_model->getFullData($this->session_id);
            $merchant_id = $sessionData->_merchant_id;
            
            $input['customer_email'] = $sessionData->_session_data['identity'];
            $input['customer_id'] = $sessionData->_session_data['user_id'];

            $this->load->model('payment_link_model');
            $result = $this->payment_link_model->save($input, $merchant_id);
            
            if(is_array($result) && isset($result['status']) && $result['status'] == false) {
                output_json_api($result, 1, REST_Controller_Codes::HTTP_OK);
                return;
            }
            
            output_json_api($result, $result['status'] ? 0 : 1, REST_Controller_Codes::HTTP_OK);

            return;
        } catch (Exception $ex) {
            output_json_api(['errors' => [$ex->getMessage()]], 1, REST_Controller_Codes::HTTP_BAD_REQUEST);
        }
        
    }

}
