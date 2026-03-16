<?php

if (!defined('BASEPATH'))
    exit('No direct script access allowed');

require_once APPPATH . '/libraries/REST_Controller_Codes.php'; //used only for setting api rest response codes

class Widget_api_202107 {

    public $access_token_expiration  = 20 * 60; //seconds - 20 minutes ||| minutes * seconds
    public $refresh_token_expiration = 6 * 30 * 24 * 60 * 60; //seconds - 6 months ||| months * days * hours * minutes * seconds
    private $tokens_chars_size       = 48;
    private $current_account         = null;

    public function __construct() {
        $this->CI = & get_instance();
    }

    public function checkBearerToken()
    {
        $headers = get_headers_safe();
        if (!isset($headers['authorization']) || strpos($headers['authorization'], 'Bearer ') !== 0) {
            return ['status' => false, 'code' => 'access_token_not_found', 'current_access_token' => null, 'http_code' => REST_Controller_Codes::HTTP_BAD_REQUEST];
        }
        return ['status' => true];
    }

    public function validaAccessToken() {

        $headers = get_headers_safe();

        if (!isset($headers['authorization']) || strpos($headers['authorization'], 'Bearer ') !== 0) {
            return ['status' => false, 'code' => 'access_token_not_found', 'current_access_token' => null, 'http_code' => REST_Controller_Codes::HTTP_BAD_REQUEST];
        }

        $auth        = explode(' ', $headers['authorization']);
        $token       = $auth[1];
        
        $tokenRecord = $this->CI->db->where('token', $token)->get('api_access_token')->row();
       
        if (!$tokenRecord) {
            return ['status' => false, 'code' => 'access_token_not_found', 'current_access_token' => null, 'http_code' => REST_Controller_Codes::HTTP_UNAUTHORIZED];
        }

        if (strtotime(date('Y-m-d H:i:s')) > strtotime($tokenRecord->expire_at)) {
            return ['status' => false, 'code' => 'access_token_expired', 'current_access_token' => null, 'http_code' => REST_Controller_Codes::HTTP_UNAUTHORIZED];
        }

        return ['status' => true, 'current_access_token' => $token];
    }

    public function validateToken() {

        $post_data     = json_decode(file_get_contents("php://input"));
        $authorization = $post_data->auth;

        if (!$authorization || strpos($authorization, 'Bearer ') !== 0) {
            return ['status' => false, 'code' => 'bad_request', 'http_code' => REST_Controller_Codes::HTTP_BAD_REQUEST];
        }

        $auth        = explode(' ', $authorization);
        $token       = $auth[1];
        $tokenRecord = $this->CI->db->where('token', $token)->get('api_access_token')->row();

        if (!$tokenRecord) {
            return ['status' => false, 'code' => 'access_token_not_found', 'http_code' => REST_Controller_Codes::HTTP_FORBIDDEN];
        }

        if (strtotime(date('Y-m-d H:i:s')) > strtotime($tokenRecord->expire_at)) {
            return ['status' => false, 'code' => 'access_token_expired', 'http_code' => REST_Controller_Codes::HTTP_UNAUTHORIZED];
        }

        $this->current_account = $this->CI->db->select('id, first_last_name, email, phone, id_church, campus_id')
                        ->where(['id_church' => $tokenRecord->church_id, 'user_id' => $tokenRecord->user_id])->order_by('id', 'desc')->get('account_donor')->row();

        return ['status' => true];
    }

    public function getCurrenAccountByToken() {
        return $this->current_account;
    }

    //review - when an donor to be opened to give in whichever organization we probably don't need the church_id & campus_id fields
    public function resetAccessToken($event, $church_id = false, $campus_id = false, $user_id = false, $refreshToken = 0) {

        $accessToken = bin2hex(openssl_random_pseudo_bytes(round($this->tokens_chars_size / 2, 0), $cstrong));

        if ($event === 'on_login') {
            $tokenExists = $this->CI->db->select('id')
                            ->where('church_id', $church_id)->where('user_id', $user_id)
                            ->get('api_access_token')->row();
            if (!$tokenExists) {
                $this->CI->db->insert('api_access_token', ['church_id' => $church_id, 'user_id'   => $user_id,
                    'token'     => $accessToken, 'expire_at' => date('Y-m-d H:i:s', strtotime("+$this->access_token_expiration second"))]);
            } else {
                $this->CI->db->where('church_id', $church_id)->where('user_id', $user_id)
                        ->update('api_access_token', ['token'     => $accessToken,
                            'expire_at' => date('Y-m-d H:i:s', strtotime("+$this->access_token_expiration second"))]);
            }
        } elseif ($event === 'on_refresh') {
            $refreshTokenRecord = $this->CI->db->where('token', $refreshToken)
                            ->get('api_refresh_token')->row();

            if (!$refreshTokenRecord) {
                return ['status' => false, 'code' => 'refresh_token_not_found', 'message' => 'you need to re-login', 'http_code' => REST_Controller_Codes::HTTP_FORBIDDEN];
            } else {
                
                if (strtotime(date('Y-m-d H:i:s')) > strtotime($refreshTokenRecord->expire_at)) {
                    return ['status' => false, 'code' => 'refresh_token_expired', 'http_code' => REST_Controller_Codes::HTTP_UNAUTHORIZED];
                }

                $this->CI->db->where('church_id', $refreshTokenRecord->church_id)->where('user_id', $refreshTokenRecord->user_id)
                        ->update('api_access_token', ['token' => $accessToken, 'expire_at' => date('Y-m-d H:i:s', strtotime("+$this->access_token_expiration second"))]);
            }
        }
        return ['status' => true, 'code' => 'token_refreshed', 'token' => $accessToken, 'http_code' => REST_Controller_Codes::HTTP_OK];
    }

    public function resetRefreshToken($event, $church_id = false, $campus_id = false, $user_id = false, $refreshToken = 0) {

        $newRToken = bin2hex(openssl_random_pseudo_bytes(round($this->tokens_chars_size / 2, 0), $cstrong));
        $tokenId = null;

        if ($event === 'on_login') {
            $tokenExists = $this->CI->db->select('id')
                            ->where('church_id', $church_id)->where('user_id', $user_id)
                            ->get('api_refresh_token')->row();
            
            if (!$tokenExists) {
                $this->CI->db->insert('api_refresh_token', ['church_id' => $church_id, 'user_id'   => $user_id,
                    'token'     => $newRToken, 'expire_at' => date('Y-m-d H:i:s', strtotime("+$this->refresh_token_expiration second"))]);
                $tokenId = $this->CI->db->insert_id();
            } else {
                $this->CI->db->where('church_id', $church_id)->where('user_id', $user_id)
                        ->update('api_refresh_token', ['token' => $newRToken, 'expire_at' => date('Y-m-d H:i:s', strtotime("+$this->refresh_token_expiration second"))]);
                $tokenId = $tokenExists->id;
            }
        } elseif ($event === 'on_refresh') {
            $tokenExists = $this->CI->db->where('token', $refreshToken)
                            ->get('api_refresh_token')->row();
            if (!$tokenExists) {
                return ['status' => false, 'code' => 'refresh_token_not_found', 'message' => 'you need to login again', 'http_code' => REST_Controller_Codes::HTTP_FORBIDDEN];
            } else {
                $this->CI->db->where('church_id', $tokenExists->church_id)
                        ->where('user_id', $tokenExists->user_id)
                        ->update('api_refresh_token', ['token' => $newRToken, 'expire_at' => date('Y-m-d H:i:s', strtotime("+$this->refresh_token_expiration second"))]);
            }
        }
        return ['status' => true, 'code' => 'token_refreshed', 'token' => $newRToken, 'token_id' => $tokenId, 'http_code' => REST_Controller_Codes::HTTP_OK];
    }
    
    public function getAccessToken($token) {
        return $this->CI->db->where('token', $token)->get('api_access_token')->row();
    }

    public function getRefreshTokenById($id) {
        return $this->CI->db->where('id', $id)->get('api_refresh_token')->row();
    }
    
    public function deleteAccessToken($token){
        $this->CI->db->where('token', $token)->delete('api_access_token');
    }
    
    public function deleteRefreshTokenByUserId($user_id){
        $this->CI->db->where('user_id', $user_id)->delete('api_refresh_token');
    }

    public function unauthorizedResponse() {
        return ['status' => false, 'message' => 'Unauthorized request', 'http_code' => REST_Controller_Codes::HTTP_UNAUTHORIZED];
    }

    public function unauthorizedCode() {
        return REST_Controller_Codes::HTTP_UNAUTHORIZED;
    }

}
