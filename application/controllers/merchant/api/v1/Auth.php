<?php

defined('BASEPATH') or exit('No direct script access allowed');

require_once APPPATH . 'controllers/merchant/api/base/Api_base_controller.php';

class Auth extends Api_base_controller
{

    public function __construct()
    {

        parent::__construct();
    }

    public function index()
    {
        if ($this->getRequestMethod() !== 'GET') {
            return $this->sendMethodNotAllowed(['GET']);
        }
        //$data = $this->getJsonInput();
        $this->output($this->getUser(), HTTP_Constants::HTTP_OK, 'GET request');
    }

    // Generate credentials, only for developer machine credentials generation
    public function generate_credentials()
    {
        if(!IS_DEVELOPER_MACHINE){
            return $this->sendUnauthorized();
        }
        if ($this->getRequestMethod() !== 'POST') {
            return $this->sendMethodNotAllowed(['POST']);
        }

        $data = $this->getJsonInput();
        $clientId = isset($data['client_id']) ? (int) $data['client_id'] : null;
        
        if(!$clientId){
            $this->sendValidationError([
                'client_id' => 'Client Id is required'
            ]);
        }
        try {
            $this->load->model('api_merchant_credentials_model');
            $result = $this->api_merchant_credentials_model->createOrUpdate($clientId);
            $this->sendSuccess($result);
        } catch (Exception $e) {
            $this->sendError($e->getMessage());
        }
    }
}
