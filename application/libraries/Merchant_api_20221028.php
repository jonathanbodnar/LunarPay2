<?php

if (!defined('BASEPATH'))
    exit('No direct script access allowed');

require_once APPPATH . '/libraries/REST_Controller_Codes.php'; //used only for setting api rest response codes

class Merchant_api_20221028 {

    const TABLE_API_KEYS = 'api_keys_merchant';

    public function __construct() {
        $this->CI = & get_instance();
    }

    public function isMerchantRequest() {
        $headers = get_headers_safe();

        $result = [];

        if (!isset($headers['authorization']) || strpos($headers['authorization'], 'Bearer sk_merchant') !== 0) {
            $result = ['status' => false];
        } else {
            $result = ['status' => true];
        }

        return $result;
    }

    public function validaAccessToken() { //isMerchantRequest() is being called before validating access token, so we are fine
        
        $headers = get_headers_safe();

        $auth  = explode(' ', $headers['authorization']);
        $token = $auth[1];

        $tokenRecord = $this->CI->db->where('token', $token)->get(self::TABLE_API_KEYS)->row();

        if (!$tokenRecord) {
            return ['status' => false, 'code' => 'access_token_not_found', 'message' => 'Access denied', 'http_code' => REST_Controller_Codes::HTTP_UNAUTHORIZED];
        }

        $this->CI->load->model('organization_model');
        $orgnx = $this->CI->organization_model->get($tokenRecord->church_id, 'ch_id, client_id, church_name as name');

        $tokenRecord->organization = $orgnx;

        unset($tokenRecord->token);
        return ['status' => true, 'message' => 'Access granted', 'data' => $tokenRecord, 'http_code' => REST_Controller_Codes::HTTP_OK];
    }

}
