<?php

defined('BASEPATH') OR exit('No direct script access allowed');

require_once 'application/controllers/customer/apiv1/utils/helper.php';

class Product extends CI_Controller{

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
            
            $this->client_id = $result['data']->organization->client_id;
            $this->orgnx_id  = $result['data']->organization->ch_id;            
            
        }
        //==================================================
        
        allow_cors(['http://localhost:5183', 'http://localhost:3000', 'https://app.leads.biz', 'https://shoutout.us', BASE_URL]); 
        
        if ($this->is_customer_request === TRUE) { //is customer request
            $this->load->model('api_session_model');
            $this->load->library('widget_api_202107');

            $action = $this->router->method;

            /* ------- NO ACCESS_TOKEN METHODS ------- */
            $free = ['get_available_by_merchant'];
            /* ------- ---------------- ------ */

            if (!in_array($action, $free)) {
                $result = $this->widget_api_202107->validaAccessToken();
                if ($result['status'] === false) {
                    output_json_custom($result);
                    die;
                }
                $this->session_id = $result['current_access_token'];
            }            
        }
    }

    //get available products
    public function get_available_by_merchant($orgSlug){
        try {

            $orgId = null;

            if (IS_DEVELOPER_MACHINE) {
                $orgId = $orgSlug; //the orgSlug is the orgId
            } else {
                $this->load->helper('crypt');
                $orgId = merchantSlugDecode($orgSlug); //the orgSlug is encoded
            }

            $this->load->model('product_customer_model');

            $result = $this->product_customer_model->getAvilableByMerchant($orgId);
            
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
