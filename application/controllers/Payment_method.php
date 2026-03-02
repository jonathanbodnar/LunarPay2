<?php

defined('BASEPATH') OR exit('No direct script access allowed');

require_once 'application/controllers/extensions/Payments.php';

class Payment_method extends My_Controller {

    public function __construct() {
        parent::__construct();

        if (!$this->ion_auth->logged_in()) {
            
                    output_json_php([
                        'status' => false, 
                'errors' => stringifyFormatErrors(['You must be logged in to use this resource']), 
                'exception' => true
            ]);
            die;            
        }       
    }

    public function create() {
        try {

            $input_json  = @file_get_contents('php://input');
            $input       = json_decode($input_json);
            
            $orgId = isset($input->org_id) ? $input->org_id : null;
            $customerId = isset($input->customer_id) ? $input->customer_id : null;
            $ftsData = isset($input->fts_event->data) ? $input->fts_event->data : null;
            $clientId = $this->session->userdata('user_id');

            if( empty($orgId) || empty($customerId)) {
                throw new Exception(langx('Organization or Customer ID is missing'));
            }
            
             // check if the user belongs to the organization
             $result = checkBelongsToUser([['church_detail.ch_id' => $orgId, 'client_id', 'users.id', $clientId]]);

            if ($result !== true) {
                throw new Exception('Bad request');
            }

            $pResult        = Payments::addPaymentSource($orgId, $customerId, $ftsData);
    
            output_json([
                'status'  => $pResult['status'],
                'message' => $pResult['message']
            ]);
        } catch (Exception $ex) {
            output_json(['status' => false, 'errors' => stringifyFormatErrors([$ex->getMessage()]), 'exception' => true]);
        }
    }

    public function remove() {
        try {

            $input_json  = @file_get_contents('php://input');
            $input       = json_decode($input_json);
            
            $sourceId = isset($input->source_id) ? $input->source_id : null;
            $customerId = isset($input->customer_id) ? $input->customer_id : null;
            $orgId = isset($input->org_id) ? $input->org_id : null;
            $clientId = $this->session->userdata('user_id');
            
            if( empty($sourceId) || empty($customerId) || empty($orgId)) {
                throw new Exception(langx('Source ID, Customer ID or Organization ID is missing'));
            }

            // check if the user belongs to the organization
            $result = checkBelongsToUser([['church_detail.ch_id' => $orgId, 'client_id', 'users.id', $clientId]]);
            
            if ($result !== true) {
                throw new Exception('Bad request');
            }
            
            $pResult        = Payments::removePaymentSource($sourceId, $customerId, $orgId);
    
            output_json([
                'status'  => $pResult['status'],
                'message' => $pResult['message']
            ]);
        } catch (Exception $ex) {
            output_json(['status' => false, 'errors' => stringifyFormatErrors([$ex->getMessage()]), 'exception' => true]);
        }
    }

    public function get_all() {
        try {
            $input_json  = @file_get_contents('php://input');
            $input       = json_decode($input_json);
            
            $orgId = isset($input->org_id) ? $input->org_id : null;
            $customerId = isset($input->customer_id) ? $input->customer_id : null;
            $clientId = $this->session->userdata('user_id');
            
            if( empty($orgId) || empty($customerId)) {
                throw new Exception(langx('Organization or Customer ID is missing'));
            }

            $this->load->model('sources_model');
            
            $secure = [
                'org_id' => $orgId,
                'client_id' => $clientId
            ];
            
            $query = [
                'id',
                'source_type',
                'src_account_type',
                'exp_month',
                'exp_year',
                'last_digits',
                'name_holder',
            ];

            $sources = $this->sources_model->getList($customerId, 'id desc', true, $query, $secure);
        
            output_json([
                'status'  => true,
                'data' => $sources
            ]);
        } catch (Exception $ex) {
            output_json(['status' => false, 'errors' => stringifyFormatErrors([$ex->getMessage()]), 'exception' => true]);
        }
    }
}
