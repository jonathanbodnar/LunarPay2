<?php

defined('BASEPATH') OR exit('No direct script access allowed');

require APPPATH . '/libraries/REST_Controller_Codes.php';

class Wtoken extends REST_Controller_Codes {

    function __construct() {
        parent::__construct();
        $this->load->library('widget_api_202107');
    }

    public function refresh() {

        $headers = get_headers_safe();

        if (!isset($headers['authorization']) || strpos($headers['authorization'], 'Bearer ') !== 0) {
            $result = ['status' => false, 'code' => 'bad_request', 'http_code' => REST_Controller_Codes::HTTP_BAD_REQUEST];
            output_json_custom($result);
            return;
        }

        $auth  = explode(' ', $headers['authorization']);
        $token = $auth[1];

        $aResp = $this->widget_api_202107->resetAccessToken('on_refresh', false, false, false, $token);

        if (!$aResp['status']) {
            output_json_custom($aResp);
            return;
        }

        $rResp = $this->widget_api_202107->resetRefreshToken('on_refresh', false, false, false, $token);

        //d($rResp);
        if (!$rResp['status']) {
            output_json_custom($rResp);
            return;
        }

        output_json_custom([
            'status'                  => true,
            'message'                 => 'tokens refreshed!',
            WIDGET_AUTH_OBJ_VAR_NAME => [WIDGET_AUTH_ACCESS_TOKEN_VAR_NAME => $aResp['token'], WIDGET_AUTH_REFRESH_TOKEN_VAR_NAME => $rResp['token']],
            'http_code'               => REST_Controller_Codes::HTTP_OK
        ]);

        return;
    }

}
