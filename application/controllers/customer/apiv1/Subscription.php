<?php

defined('BASEPATH') OR exit('No direct script access allowed');

require_once 'application/controllers/customer/apiv1/utils/helper.php';

class Subscription extends CI_Controller{

    private $session_id = null;
    private $is_customer_request = TRUE;
    private $client_id = null; //dash user id, owner of the organization

    public function __construct()
    {
        parent::__construct();
        
        //when accessing the api as merchant all endpoints are secured
        $this->load->library('merchant_api_20221028');         
        
        if ($this->merchant_api_20221028->isMerchantRequest()['status']) {
            $this->is_customer_request = FALSE; // it means the request comes from a merchant
            $result                    = $this->merchant_api_20221028->validaAccessToken();
                        
            if($result['status'] === false) {
                output_json_api($result, 0, REST_Controller_Codes::HTTP_OK);
                die;
            }
            
            $this->client_id   = $result['data']->organization->client_id;  
            
        }
        //==================================================

        allow_cors(['http://localhost:5183', 'http://localhost:3000', 'https://app.leads.biz', 'https://shoutout.us', BASE_URL]); 

        
        if ($this->is_customer_request === TRUE) { //is customer request
            $this->load->model('api_session_model');
            $this->load->library('widget_api_202107');

            $result = $this->widget_api_202107->validaAccessToken();

            if ($result['status'] === false) {
                output_json_custom($result);
                die;
            }
            $this->session_id = $result['current_access_token'];
        }
    }

    public function cancel(){
        try {
            $input = @file_get_contents('php://input');
            $request = json_decode($input);
            
            if($this->is_customer_request) {
                $client_id = false;
                $donorId = $this->api_session_model->getValue($this->session_id, 'user_id');
            } else {
                $client_id = $this->client_id;
                $donorId = false;
            }
            
            $sub_id = isset($request->subscription_id) ? $request->subscription_id : null;

            require_once 'application/controllers/extensions/Payments.php';

            $pResult = Payments::stopSubscription($sub_id, $client_id, $donorId);
            $error = $pResult['status'] ? 0 : 1;
            
            output_json_api(['status' => $pResult['status'], 'message' => $pResult['message']], $error, REST_Controller_Codes::HTTP_OK);
        } catch (Exception $ex) {
            output_json_api(['errors' => [$ex->getMessage()]], 1, REST_Controller_Codes::HTTP_BAD_REQUEST);
        }
    }
}
