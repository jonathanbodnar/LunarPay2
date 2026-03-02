<?php

defined('BASEPATH') or exit('No direct script access allowed');

require_once APPPATH . 'controllers/merchant/api/base/Api_base_controller.php';
require_once APPPATH . 'vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class Customer extends Api_base_controller
{

    public function __construct()
    {

        parent::__construct();
    }

    public function create()
    {
        if ($this->getRequestMethod() !== 'POST') {
            return $this->sendMethodNotAllowed(['POST']);
        }

        try {
            $this->load->model('donor_model');
            $user = $this->getUser();
            
            $data = $this->getJsonInput();
            
            $orgId = isset($data['org_id']) ? $data['org_id'] : null;
            $email = isset($data['email']) ? $data['email'] : null;
            $first_name = isset($data['first_name']) ? $data['first_name'] : null;
            $last_name = isset($data['last_name']) ? $data['last_name'] : null;
            $metadata = isset($data['metadata']) ? $data['metadata'] : null;
            
            $clientId = $user->client_id; //main user of the merchant
            $saveData = [
                'organization_id' => $orgId,
                'client_id' => $clientId,
                'email' => $email,
                'first_name' => $first_name,
                'last_name' => $last_name,
                'created_from' => 'merchant-api', // Track that this customer was created via API
                'metadata' => $metadata // Store metadata as JSON
            ];

            $this->donor_model->valAsArray = true; // array values for validation response
            $result = $this->donor_model->save($saveData, $clientId);
            if(!$result['status']){
                $this->sendValidationError($result['errors']);
            }
            
            // Return the proper structure for MagicWeb
            $response = [
                'id' => $result['data']['id'],
                'email' => $email,
                'first_name' => $first_name,
                'last_name' => $last_name,
                'org_id' => $orgId,
                'client_id' => $clientId,
                'created_from' => 'merchant-api',
                'metadata' => $metadata,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];
            
            $this->sendSuccess($response);
        } catch (Exception $e) {
            $this->sendError($e->getMessage());
        }
    }

    /**
     * Get customer by email
     * GET /customer/by_email?org_id=303&email=user@example.com
     */
    public function by_email()
    {
        if ($this->getRequestMethod() !== 'GET') {
            return $this->sendMethodNotAllowed(['GET']);
        }

        try {
            $this->load->model('donor_model');
            $user = $this->getUser();
            
            $orgId = $this->input->get('org_id');
            $email = $this->input->get('email');
            
            if (!$orgId) {
                return $this->sendValidationError(['org_id' => 'Organization ID parameter is required']);
            }

            if (!$email) {
                return $this->sendValidationError(['email' => 'Email parameter is required']);
            }

            // Validate email format
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return $this->sendValidationError(['email' => 'Invalid email format']);
            }

            $clientId = $user->client_id;
            
            // Get customer by email and organization
            $customer = $this->donor_model->getByEmail($email, $orgId, $clientId);
            
            if (!$customer) {
                return $this->sendError('Customer not found', 404);
            }

            // Format response
            $response = [
                'id' => $customer->id,
                'email' => $customer->email,
                'first_name' => $customer->first_name,
                'last_name' => $customer->last_name,
                'org_id' => $customer->id_church,
                'metadata' => $customer->metadata ? json_decode($customer->metadata, true) : null,
                'created_at' => $customer->created_at,
                'updated_at' => $customer->updated_at
            ];

            $this->sendSuccess($response);
        } catch (Exception $e) {
            $this->sendError($e->getMessage());
        }
    }

    /**
     * Get customer by ID
     * GET /customer/by-id/{id}
     */
    public function by_id($id = null)
    {
        if ($this->getRequestMethod() !== 'GET') {
            return $this->sendMethodNotAllowed(['GET']);
        }

        if (!$id) {
            return $this->sendValidationError(['id' => 'Customer ID is required']);
        }

        try {
            $this->load->model('donor_model');
            $user = $this->getUser();
            
            $clientId = $user->client_id;
            
            // Get customer by ID
            $customer = $this->donor_model->getById($id, null, $clientId);
            
            if (!$customer) {
                return $this->sendError('Customer not found', 404);
            }

            // Format response
            $response = [
                'id' => $customer->id,
                'email' => $customer->email,
                'first_name' => $customer->first_name,
                'last_name' => $customer->last_name,
                'org_id' => $customer->id_church,
                'metadata' => $customer->metadata ? json_decode($customer->metadata, true) : null,
                'created_at' => $customer->created_at,
                'updated_at' => $customer->updated_at
            ];

            $this->sendSuccess($response);
        } catch (Exception $e) {
            $this->sendError($e->getMessage());
        }
    }

    public function generate_session() {
        if ($this->getRequestMethod() !== 'POST') {
            return $this->sendMethodNotAllowed(['POST']);
        }

        $this->load->model('api_session_model');
        $this->load->model('donor_model');
        $this->load->model('payment_link_model');
        $this->load->library('widget_api_202107');        

        try {
            
            $data = $this->getJsonInput();

            $orgId = isset($data['org_id']) ? $data['org_id'] : null;
            $customerId = isset($data['customer_id']) ? $data['customer_id'] : null;
            $paymentLinkHash = isset($data['payment_link_hash']) ? $data['payment_link_hash'] : null;
            $successCallback = isset($data['success_callback']) ? $data['success_callback'] : null;

            $user = $this->getUser();
            $clientId = $user->client_id; //main user of the merchant
            
            $errors = [];

            if (!$orgId) {
                $errors['org_id'] = 'org_id is required';
            }

            if (!$customerId) {
                $errors['customer_id'] = 'customer_id is required';
            }

            if(!$paymentLinkHash) {
                $errors['payment_link_hash'] = 'payment_link_hash is required';
            } else {
                // Validate payment link
                $this->load->model('payment_link_model');
                $paymentLink = $this->payment_link_model->getByHashSimple($paymentLinkHash, $orgId, $clientId);
               if (!$paymentLink) {
                    $errors['payment_link_hash'] = 'Invalid payment link hash';
                }
            }
            
            // Validate post_purchase_link if provided
            if ($successCallback) {
                // Allow localhost and 127.0.0.1 for development
                $isLocalhost = str_starts_with($successCallback, 'http://localhost') ||
                            str_starts_with($successCallback, 'http://127.0.0.1');

                if (!$isLocalhost && !str_starts_with($successCallback, 'https://')) {
                    $errors['success_callback'] = 'Success callback URL must use HTTPS';
                }
            }
                        
            if (!empty($errors)) {
                $this->sendValidationError($errors);
            }

            // Get customer data
            
            $customer = $this->donor_model->getById($customerId, $orgId, $clientId);
            
            if (!$customer) {
                $this->sendValidationError(['customer_id' => 'Customer not found']);
            }

            $church_id = $customer->id_church;
            $campus_id = $customer->campus_id;
            $identity = $customer->email;

            $access_token  = $this->widget_api_202107->resetAccessToken('on_login', $church_id, $campus_id, $customerId);            
            $refresh_token = $this->widget_api_202107->resetRefreshToken('on_login', $church_id, $campus_id, $customerId);

            $customerToken = $access_token['token'];
            $customerRefreshTokenId = $refresh_token['token_id'];
            
            $tokenFullData = $this->widget_api_202107->getAccessToken($customerToken);
            $customerTokenId = $tokenFullData->id;

            $this->api_session_model->setValue($customerToken, 'user_id', $customerId);
            $this->api_session_model->setValue($customerToken, 'identity', $identity);

            // Generate JWT token instead of random token
            $jwtSecret = $_ENV['APP_ENCRYPTION_KEY'];
            $redirectUrl = BASE_URL . 'c/portal/payment_link/' . $paymentLink->hash;
            
            // If post_purchase_link is provided, concatenate it with redirect_url as GET parameter
            if ($successCallback) {
                $redirectUrl .= '?success_callback=' . urlencode($successCallback);
            }
            
            $jwtPayload = [
                'sub' => $clientId,
                'atid' => $customerTokenId,
                'rtid' => $customerRefreshTokenId,              
                'aud' => 'payment_link',
                'customer_id' => $customerId,                
                'org_id' => $church_id,
                'jti' => uniqid(),
                'iat' => time(),
                'exp' => time() + 1800 // Token expires in 30 minutes
            ];
            $jwtToken = JWT::encode($jwtPayload, $jwtSecret, 'HS256');
            
            $sessionLinkData = [
                'token_link' => $jwtToken,
                'redirect_url' => $redirectUrl,
                'post_purchase_link' => $successCallback, // Store the post purchase link for later use
            ];

            $this->api_session_model->setValue($customerToken,'generated_session_link',$sessionLinkData);
            
            $sessionData = [
                'post_request' => BASE_URL . 'merchant/api/v1/customer/validate_token_link',
                'token_link' => $jwtToken,
                'redirect_url' => $redirectUrl
            ];

            $this->sendSuccess($sessionData);
        } catch (Exception $e) {
            $this->sendError($e->getMessage());
        }
    }

    // Validate token comming from third party app, it is used for creating the storage session and redirect the customer
    public function validate_token_link() {
        if ($this->getRequestMethod() !== 'POST') {
            return $this->sendMethodNotAllowed(['POST']);
        }

        $data = $this->getRequestData();

        $tokenLink = isset($data['token_link']) ? $data['token_link'] : null;
        $redirectUrl = isset($data['redirect_url']) ? $data['redirect_url'] : null;
        
        $errors = [];

        if(!$tokenLink){
            $errors['token_link'] = 'token_link is required';
        }
        if(!$redirectUrl){
            $errors['redirect_url'] = 'redirect_url is required';
        }

        if($errors){
            $this->sendValidationError($errors);
        }

        try {
            $jwtSecret = $_ENV['APP_ENCRYPTION_KEY'];

            $decoded = JWT::decode($tokenLink, new Key($jwtSecret, 'HS256'));

            $jwtData = [
                'sub' => $decoded->sub,
                'atid' => $decoded->atid,
                'rtid' => $decoded->rtid,
                'aud' => $decoded->aud,                
                'org_id' => $decoded->org_id,
                'jti' => $decoded->jti,
                'iat' => $decoded->iat,
                'exp' => $decoded->exp
            ];

            $this->load->model('api_session_model');
            $this->load->library('widget_api_202107');        

            $sessionFullData = $this->api_session_model->getById($jwtData['atid']);
            $refreshTokenData = $this->widget_api_202107->getRefreshTokenById($jwtData['rtid']);
            
            $access_token = $sessionFullData['token'];
            $refresh_token = $refreshTokenData->token;   
            
             // Extract post_purchase_link from redirect URL if present
             $postPurchaseLink = null;
             if (strpos($redirectUrl, '?success_callback=') !== false) {
                 $urlParts = parse_url($redirectUrl);
                 if (isset($urlParts['query'])) {
                     parse_str($urlParts['query'], $queryParams);
                     if (isset($queryParams['success_callback'])) {
                         $postPurchaseLink = urldecode($queryParams['success_callback']);
                     }
                 }
             }

            $viewData = [
                'sub' => $decoded->sub, //customer_id
                'aud' => $decoded->aud,                
                'org_id' => $decoded->org_id,
                'jti' => $decoded->jti,
                'iat' => $decoded->iat,
                'exp' => $decoded->exp,
                'access_token' => $access_token,
                'refresh_token' => $refresh_token,
                'redirect_url' => $redirectUrl,
                'post_purchase_link' => $postPurchaseLink                
            ];

            $this->_renderStorageSession($viewData, $redirectUrl);            

        } catch (Exception $e) {            
            $this->sendError('Token error: ' . $e->getMessage());
        }            
    }

    private function _renderStorageSession($viewData, $redirectUrl) {
        header('Content-Type: text/html; charset=utf-8');

        $this->load->library('widget_api_202107');    
        $this->load->model('api_session_model');        

        $this->load->use_theme(THEME_LAYOUT_API); 
        $this->load->view('create_customer_storage_session', ['viewData' => $viewData, 'redirectUrl' => $redirectUrl]);        
    }
}
