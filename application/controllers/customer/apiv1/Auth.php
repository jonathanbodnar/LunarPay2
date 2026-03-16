<?php

defined('BASEPATH') OR exit('No direct script access allowed');

require_once 'application/controllers/customer/apiv1/utils/helper.php';

class Auth extends CI_Controller {

    private $session_id = null;
    private $is_customer_request = TRUE;
    private $orgnx_id = null;
    private $suborgnx_id = null;
    private $client_id = null; //dash user id, owner of the organization
    
    public function __construct() {

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
            
            $this->orgnx_id    = $result['data']->church_id;
            $this->suborgnx_id = $result['data']->campus_id;
            $this->client_id   = $result['data']->organization->client_id;  
            
        }
        //==================================================
        
        //when accessing the api as a customer

        allow_cors(['http://localhost:5183', 'http://localhost:3000', 'https://app.leads.biz', 'https://shoutout.us', BASE_URL]); 
        
        if ($this->is_customer_request === TRUE) { //is customer request
            $this->load->model('api_session_model');
            $this->load->library('widget_api_202107');

            $action = $this->router->method;

            /* ------- NO ACCESS_TOKEN METHODS ------- */
            $free = ['generate_security_code', 'login', 'register', 'account_exists', 'refresh_token'];
            /* ------- ---------------- ------ */

            if (!in_array($action, $free)) {
                $result = $this->widget_api_202107->validaAccessToken();
                if ($result['status'] === false) {
                    output_json_api(['errors' => $result['code'], 'details' => $result], 1, $result['http_code']);
                    exit;
                }
                $this->session_id = $result['current_access_token'];
            }
        }
    }

    public function account_exists() {
        $input_json = @file_get_contents('php://input');
        $input      = json_decode($input_json);

        try {
            
            $identity  = $input->username;
            if($this->is_customer_request) { //is a merchant request                
                $church_id = isset($input->org_id) ? $input->org_id : null;
            } else {
                $church_id = $this->orgnx_id;
            }

            /*if (isset($input->suborg_id) || $input->suborg_id) {
                throw new Exception('Processing with sub organizations is not ready');
            }*/

            $this->load->model('organization_model');
            $this->organization_model->valAsArray = true; //get validation errors as array, not a string
            $orgnx = $this->organization_model->get($church_id, 'church_name, client_id');
            if (!$orgnx) {
                throw new Exception('Invalid Company');
            }

            $this->load->model('donor_model');
            $this->donor_model->valAsArray        = true; //get validation errors as array, not a string            
            $customerAcc = $this->donor_model->getLoginData($identity, $church_id);

            output_json_api(['status' => $customerAcc ? true : false], 0, REST_Controller_Codes::HTTP_OK);
            
        } catch (Exception $ex) {
            output_json_api(['errors' => [$ex->getMessage()]], 1, REST_Controller_Codes::HTTP_BAD_REQUEST);
        }
    }

    public function generate_security_code() {
        $input_json = @file_get_contents('php://input');
        $input      = json_decode($input_json);

        try {

            $identity  = $input->username;
            $church_id = $input->org_id;

            /*if (isset($input->suborg_id) || $input->suborg_id) {
                throw new Exception('Processing with sub organizations is not ready');
            }*/

            $this->load->model('organization_model');
            $this->organization_model->valAsArray = true; //get validation errors as array, not a string

            $orgnx = $this->organization_model->get($church_id, 'church_name');

            if (!$orgnx) {
                throw new Exception('Invalid Company');
            }
            
            $subject   = $orgnx->church_name . ' - Security Code';
            $from_name = $orgnx->church_name;

            $this->load->helper('verification_code');

            $result = sendVerificationCode($identity, $subject, $from_name);

            output_json_api($result, $result['status'] ? 0 : 1, REST_Controller_Codes::HTTP_OK);

            return;
        } catch (Exception $ex) {
            output_json_api(['errors' => [$ex->getMessage()]], 1, REST_Controller_Codes::HTTP_BAD_REQUEST);
        }
    }

    public function register() {
        $input_json = @file_get_contents('php://input');
        $input      = json_decode($input_json);

        $this->load->model('organization_model');
        $this->organization_model->valAsArray = true; //get validation errors as array, not a string
        $this->load->model('donor_model');
        $this->donor_model->valAsArray        = true; //get validation errors as array, not a string

        try {

            $customerData['email']           = $identity                        = $input->username;            
            $customerData['first_name']      = $input->name; //if first name has two words, the saving processs will save first and last name on database, model does that split, cool.

            /*if (isset($input->suborg_id) || $input->suborg_id) {
                throw new Exception('Processing with sub organizations not ready');
            }*/
            $customerData['suborganization_id'] = $campus_id                          = null;

            $security_code = null;
            if ($this->is_customer_request) {
                $this->donor_model->validateFirstName = false; //if first name is not set, the model will not validate it | fortis will not send it
                $customerData['organization_id'] = $church_id                       = isset($input->org_id) ? $input->org_id : null;
                $security_code                   = isset($input->security_code) ? $input->security_code : null;

                $this->load->model('code_security_model');
                $code_security = $this->code_security_model->get($identity, $security_code);

                $access_token['token']  = null;
                $refresh_token['token'] = null;

                $login_success = false;
                if ($code_security) {
                    $login_success = true;
                    $this->code_security_model->reset($identity);

                    $customerAcc = $this->donor_model->getLoginData($identity, $church_id);
                    if (!$customerAcc) { //create account
                        $orgnx = $this->organization_model->get($church_id, 'church_name, client_id');

                        if (!$orgnx) {
                            throw new Exception('Invalid Company');
                        }            

                        $response = $this->donor_model->save($customerData, $orgnx->client_id);
                        if (!$response['status']) {
                            output_json_api($response, 1, REST_Controller_Codes::HTTP_OK);
                            return;
                        }
                        $customerAcc = $this->donor_model->getLoginData($identity, $church_id);
                    } else {
                        output_json_api(['status' => false, 'message' => 'Account already exists'], 1, REST_Controller_Codes::HTTP_OK);
                        return;
                    }

                    $access_token  = $this->widget_api_202107->resetAccessToken('on_login', $church_id, $campus_id, $customerAcc->id);
                    $refresh_token = $this->widget_api_202107->resetRefreshToken('on_login', $church_id, $campus_id, $customerAcc->id);

                    $this->session_id = $access_token['token'];
                    $this->api_session_model->setValue($this->session_id, 'user_id', $customerAcc->id);
                    $this->api_session_model->setValue($this->session_id, 'identity', $identity);
                }

                output_json_api([
                    'status'                 => $login_success,
                    'message'                => $login_success ? langx('Account created, Access granted') : langx('Security code provided does not match'),
                    WIDGET_AUTH_OBJ_VAR_NAME => [
                        WIDGET_AUTH_ACCESS_TOKEN_VAR_NAME  => $access_token['token'],
                        WIDGET_AUTH_REFRESH_TOKEN_VAR_NAME => $refresh_token['token']
                    ]], $login_success ? 0 : 1, REST_Controller_Codes::HTTP_OK);

            } else {
                $customerData['organization_id'] = $church_id                       = $this->orgnx_id; //from merchant request
                $customerAcc = $this->donor_model->getLoginData($identity, $church_id);
                if (!$customerAcc) { //create account
                    $orgnx = $this->organization_model->get($church_id, 'church_name, client_id');

                    if (!$orgnx) {
                        throw new Exception('Invalid Company');
                    }            

                    $response = $this->donor_model->save($customerData, $orgnx->client_id);
                    if (!$response['status']) {
                        output_json_api($response, 1, REST_Controller_Codes::HTTP_OK);
                        return;
                    }
                    output_json_api(['status' => true, 'message' => langx('Account created'),], 1, REST_Controller_Codes::HTTP_OK);                    
                } else {
                    output_json_api(['status' => false, 'message' => 'Account already exists'], 1, REST_Controller_Codes::HTTP_OK);
                    return;
                }
            }
        } catch (Exception $ex) {
            output_json_api(['errors' => [$ex->getMessage()]], 0, REST_Controller_Codes::HTTP_BAD_REQUEST);
        }
    }
    
    public function login() {
        $input_json = @file_get_contents('php://input');
        $input      = json_decode($input_json);

        try {

            $customerData['email']           = $identity                        = $input->username;
            $customerData['organization_id'] = $church_id                       = $input->org_id;            
            $security_code                   = $input->security_code;

            /*if (isset($input->suborg_id) || $input->suborg_id) {
                throw new Exception('Processing with sub organizations not ready');
            }*/
            $customerData['suborganization_id'] = $campus_id                          = null;

            $this->load->model('donor_model');
            $this->donor_model->valAsArray        = true; //get validation errors as array, not a string
            $this->load->model('organization_model');
            $this->organization_model->valAsArray = true; //get validation errors as array, not a string

            $orgnx = $this->organization_model->get($church_id, 'church_name, client_id');

            if (!$orgnx) {
                throw new Exception('Invalid Company');
            }

            $customerAcc = $this->donor_model->getLoginData($identity, $church_id);

            if (!$customerAcc) { //create account                
                output_json_api(['status' => false, 'message' => 'Account provided not found'], 1, REST_Controller_Codes::HTTP_OK);
                return;
            } 

            $this->load->model('code_security_model');
            $code_security = $this->code_security_model->get($identity, $security_code);

            $access_token['token']  = null;
            $refresh_token['token'] = null;

            $login_success = false;
            if ($code_security) {
                $login_success = true;
                $this->code_security_model->reset($identity);

                $access_token  = $this->widget_api_202107->resetAccessToken('on_login', $church_id, $campus_id, $customerAcc->id);
                $refresh_token = $this->widget_api_202107->resetRefreshToken('on_login', $church_id, $campus_id, $customerAcc->id);

                $this->session_id = $access_token['token'];
                $this->api_session_model->setValue($this->session_id,'user_id',$customerAcc->id);
                $this->api_session_model->setValue($this->session_id,'identity',$identity);
            }

            output_json_api([
                'status'                 => $login_success,
                'message'                => $login_success ? langx('Access granted') : langx('Security code provided does not match'),
                WIDGET_AUTH_OBJ_VAR_NAME => [
                    WIDGET_AUTH_ACCESS_TOKEN_VAR_NAME  => $access_token['token'],
                    WIDGET_AUTH_REFRESH_TOKEN_VAR_NAME => $refresh_token['token']
                ]], $login_success ? 0 : 1, REST_Controller_Codes::HTTP_OK);
        } catch (Exception $ex) {
            output_json_api(['errors' => [$ex->getMessage()]], 1, REST_Controller_Codes::HTTP_BAD_REQUEST);
        }
    }

    public function sign_out()
    {
        try {
        $accessToken = $this->widget_api_202107->getAccessToken($this->session_id);

        $this->widget_api_202107->deleteAccessToken($this->session_id);
        $this->widget_api_202107->deleteRefreshTokenByUserId($accessToken->user_id);

        output_json_api(['status' => true , 'message' => 'You have successfully logged out!'], 0, REST_Controller_Codes::HTTP_OK);
        } catch (Exception $ex) {
            output_json_api(['errors' => [$ex->getMessage()]], 1, REST_Controller_Codes::HTTP_BAD_REQUEST);
        }
    }
    
    public function refresh_token() {

        $headers = get_headers_safe();

        if (!isset($headers['authorization']) || strpos($headers['authorization'], 'Bearer ') !== 0) {
            $result = ['status' => false, 'code' => 'bad_request', 'http_code' => REST_Controller_Codes::HTTP_BAD_REQUEST];
            output_json_api($result, 1, $result['http_code']);            
            return;
        }

        $auth  = explode(' ', $headers['authorization']);
        $refreshToken = $auth[1];

        $aResp = $this->widget_api_202107->resetAccessToken('on_refresh', false, false, false, $refreshToken);

        if (!$aResp['status']) {
            output_json_api($aResp, 1, $aResp['http_code']);
            return;
        }

        $rResp = $this->widget_api_202107->resetRefreshToken('on_refresh', false, false, false, $refreshToken);

        
        if (!$rResp['status']) {
            output_json_api($aResp, 1, $aResp['http_code']);
            return;
        }

        output_json_api([
            'status'                  => true,
            'message'                 => 'tokens refreshed!',
            WIDGET_AUTH_OBJ_VAR_NAME => [WIDGET_AUTH_ACCESS_TOKEN_VAR_NAME => $aResp['token'], WIDGET_AUTH_REFRESH_TOKEN_VAR_NAME => $rResp['token']],
            'http_code'               => REST_Controller_Codes::HTTP_OK
        ], 0, REST_Controller_Codes::HTTP_OK);

        return;
    }

    public function is_logged(){
        $input_json = @file_get_contents('php://input');
        $input      = json_decode($input_json);

        try {
            $user_id    = $this->api_session_model->getValue($this->session_id,'user_id');
            $church_id  = $input->org_id;
            $campus_id  = null; // suborg_id is not implemented yet

            $data = null;
            if($user_id){

                $fullSData = $this->api_session_model->getFullData($this->session_id);                
                $sessOrgId  = $fullSData->church_id;
                if($sessOrgId != $church_id){ // the church id may be useless how ever front end apps are sending it, this is just a security check
                    throw new Exception('Bad request: Organization does not match'); 
                }

                $this->load->model('donor_model');
                $user = $this->donor_model->is_logged($user_id,$church_id,$campus_id);

                $data = [
                    'email' => $user->email,
                    'name'  => $user->first_name . ($user->last_name ? ' ' .$user->last_name : '')
                ];
            }
            output_json_api(['status' => $user_id ? true : false , 'data' => $data], 0, REST_Controller_Codes::HTTP_OK);
        } catch (Exception $ex) {
            output_json_api(['errors' => [$ex->getMessage()]], 1, REST_Controller_Codes::HTTP_BAD_REQUEST);
        }
    }

    public function get_user()
    {
        try {
            $client_id   = false;
            $checkClient = false;
            if($this->is_customer_request) {
                $user_id = $this->api_session_model->getValue($this->session_id,'user_id');
            } else {
                $input_json  = @file_get_contents('php://input');
                $input       = json_decode($input_json);
                $user_id     = isset($input->customer_id) ? $input->customer_id : null;
                $client_id   = $this->client_id; //needed for securing data, merchant can query their customers/users only
                $checkClient = true; //needed for securing data, merchant can query their customers/users only
            }

            $this->load->model('donor_model');
            $result = $this->donor_model->getProfile($user_id, $client_id, $checkClient);
            
            if(is_array($result) && isset($result['status']) && $result['status'] == false) {
                output_json_api($result, 1, REST_Controller_Codes::HTTP_OK);
                return;
            }
            
            output_json_api(['status' => true, 'user' => $result], 0, REST_Controller_Codes::HTTP_OK);
            
        } catch (Exception $ex) {
            output_json_api(['errors' => [$ex->getMessage()]], 1, REST_Controller_Codes::HTTP_BAD_REQUEST);
        }
    }
    
    public function get_merchant_customers() {
        //$this->load->model('donor_model');
        //$user = $this->donor_model->get(['id_church' => $orgnx_id], 'id, first_name, last_name, email, created_at',false,false);
        //public function get($where_or_id, $select = false, $row = true,$client_id = null) {
    }
}
