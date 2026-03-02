<?php

defined('BASEPATH') or exit('No direct script access allowed');

// Include HTTP constants
require_once APPPATH . 'config/http_constants.php';

// Include traits
require_once APPPATH . 'controllers/merchant/api/base/traits/AuthTrait.php';
require_once APPPATH . 'controllers/merchant/api/base/traits/ResponseTrait.php';
require_once APPPATH . 'controllers/merchant/api/base/traits/RequestTrait.php';
require_once APPPATH . 'controllers/merchant/api/base/traits/ValidationTrait.php';
require_once APPPATH . 'controllers/merchant/api/base/traits/UtilityTrait.php';

// Api_base_controller is used as base for the merchant controllers

class Api_base_controller extends CI_Controller
{
    use AuthTrait, ResponseTrait, RequestTrait, ValidationTrait, UtilityTrait;

    protected $requestMethod;
    protected $requestData;
    protected $headers;

    protected $currentUser;

    public function __construct()
    {
        parent::__construct();

        // Set content type to JSON
        header('Content-Type: application/json; charset=utf-8');

        // Handle CORS if needed
        $this->handleCors();

        // Get request method and data
        $this->requestMethod = $_SERVER['REQUEST_METHOD'];
        
        $this->headers = $this->getRequestHeaders();
        $this->requestData = $this->parseRequestData();

        // Handle preflight OPTIONS request
        if ($this->requestMethod === 'OPTIONS') {
            http_response_code(HTTP_Constants::HTTP_OK);
            exit();
        }

        // AUTH PROTECTION (applies to all children by default)
        if (!$this->isAuthExempt()) {
            $this->enforceCredentialAuth();
        }
    }
} 