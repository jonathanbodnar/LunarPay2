<?php

defined('BASEPATH') OR exit('No direct script access allowed');

require_once 'application/controllers/customer/apiv1/utils/helper.php';

class Organization extends CI_Controller {

    private $session_id         = null;
    private $is_session_enabled = false;
   
    public function __construct() {

        parent::__construct();

        $this->load->model('api_session_model');
        $this->load->library('widget_api_202107');

        allow_cors(['http://localhost:5183', 'http://localhost:3000', 'https://app.leads.biz', 'https://shoutout.us', BASE_URL]); 

        $action = $this->router->method;

        /* ------- NO ACCESS_TOKEN METHODS ------- */
        $free = ['get_settings']; //method some times needs token validation
        /* ------- ---------------- ------ */

        //restrict endpoint when method/action is not in the free array OR
        if (!in_array($action, $free)) {

            if ($action == 'get_brand_settings') {
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

    public  function get_brand_settings($orgSlug = null, $suborg_id = null)
    {
        try {
            $orgId = null;

            $headers = get_headers_safe();
            if (isset($headers['x-app']) && $headers['x-app'] == 'customer-hub') {
                //logic for customer-hub
                if(IS_DEVELOPER_MACHINE) {
                    $orgId = $orgSlug; //the orgSlug is the orgId
                } else {
                    $this->load->helper('crypt');
                    $orgId = merchantSlugDecode($orgSlug); //the orgSlug is encoded
                }
            } else {
                //logic for the invoices and payment links app
                $orgId = $orgSlug; //the orgSlug is the orgId
            }

            $this->load->model('chat_setting_model');
            $result = $this->chat_setting_model->getChatSettingByChurch($orgId, $suborg_id);

            $this->load->model('product_customer_model');
            
            $resultTotal = $this->product_customer_model->getAvailableByMerchantCount($orgId);
            $result->_shopAvailable = $resultTotal ? true : false;
            output_json_api([
                'data'            => $result,
            ], 0, REST_Controller_Codes::HTTP_OK);
        } catch (Exception $ex) {
            output_json_api(['errors' => [$ex->getMessage()]], 1, REST_Controller_Codes::HTTP_BAD_REQUEST);
        }
    }

} 
