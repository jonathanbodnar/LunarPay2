<?php

defined('BASEPATH') OR exit('No direct script access allowed');

require_once 'application/controllers/customer/apiv1/utils/helper.php';

class Payment extends CI_Controller{

    private $session_id = null;
    private $is_customer_request = TRUE;
    private $client_id = null; //dash user id, owner of the organization
    private $orgnx_id = null; //organization involved

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
            
            $this->client_id = $result['data']->organization->client_id;
            $this->orgnx_id  = $result['data']->organization->ch_id;            
            
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

    public function get_all_by_customer(){
        try {
            $client_id   = false;
            
            if($this->is_customer_request) {
                $user_id = $this->api_session_model->getValue($this->session_id,'user_id');
            } else {
                $input_json  = @file_get_contents('php://input');
                $input       = json_decode($input_json);
                $user_id     = isset($input->customer_id) ? $input->customer_id : null;
                $client_id   = $this->client_id; //needed for securing data, merchant can query their customers/users only            
            }

            $this->load->model('donation_customer_model');

            $pagination = [
                'page' => isset($_GET['page']) ? $_GET['page']  : 1,
                'limit' => isset($_GET['limit']) ? $_GET['limit'] : 10
            ];

            $result = $this->donation_customer_model->getPayments($user_id, $pagination);
            
            if(is_array($result) && isset($result['status']) && $result['status'] == false) {
                output_json_api($result, 1, REST_Controller_Codes::HTTP_OK);
                return;
            }
            
            output_json_api(['status' => true, 'data' => $result], 0, REST_Controller_Codes::HTTP_OK);
            
        } catch (Exception $ex) {
            output_json_api(['errors' => [$ex->getMessage()]], 1, REST_Controller_Codes::HTTP_BAD_REQUEST);
        }
    }

    public function get_products_paid_by_customer(){
        try {
            $client_id   = false;
            
            if($this->is_customer_request) {
                $user_id = $this->api_session_model->getValue($this->session_id,'user_id');
            } else {
                $input_json  = @file_get_contents('php://input');
                $input       = json_decode($input_json);
                $user_id     = isset($input->customer_id) ? $input->customer_id : null;
                $client_id   = $this->client_id; //needed for securing data, merchant can query their customers/users only            
            }

            $this->load->model('donation_customer_model');

            $result = $this->donation_customer_model->getPaymentsWithProduct($user_id, $client_id);
            
            if(is_array($result) && isset($result['status']) && $result['status'] == false) {
                output_json_api($result, 1, REST_Controller_Codes::HTTP_OK);
                return;
            }
            
            output_json_api(['status' => true, 'data' => $result], 0, REST_Controller_Codes::HTTP_OK);
            
        } catch (Exception $ex) {
            output_json_api(['errors' => [$ex->getMessage()]], 1, REST_Controller_Codes::HTTP_BAD_REQUEST);
        }
    }
}
