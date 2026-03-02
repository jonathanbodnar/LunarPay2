<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Zapier extends My_Controller {

    private $curr_user = null;

    public function __construct() {
        parent::__construct();

        $this->load->library('ion_auth');
        $this->load->model('user_model');        
    }

    public function auth($default = 'login_only') {

        $headers = get_headers_safe();

        if (!isset($headers['authorization']) || strpos($headers['authorization'], 'Basic ') !== 0) {
            output_json(['status' => false, 'code' => '401']);
            http_response_code(401);
            return false;
        }

        $authSplit = explode(':', base64_decode(explode(' ', $headers['authorization'])[1]), 2);

        if (count($authSplit) != 2) {
            output_json(['status' => false, 'code' => '401']);
            http_response_code(401);
            return false;
        }

        $email    = $authSplit[0];
        $password = $authSplit[1];
        $remember = false;
        if ($this->ion_auth->login($email, $password, $remember)) {
            if ($default == 'login_only') {
                output_json(['status' => true, 'code' => '200']);
                http_response_code(200);
                return true;
            } else {
                // ===== continue with the script
                $this->curr_user = $this->user_model->getByEmail($email, 'id, first_name, last_name, email');
                return true;
            }
        }

        http_response_code(401);
        return false;
    }

    public function get_new_donations() {

        $response = $this->auth('resource');
        if ($response === false) {
            output_json(['status' => false, 'code' => '401']);
            return $response;
        }

        $user_id = $this->curr_user->id;

        $this->load->model('donation_model');
        $data = $this->donation_model->getDonationsZapierPoll($user_id);

        http_response_code(200);
        output_json($data);
    }

    public function get_new_donors() {
        $response = $this->auth('resource');
        if ($response === false) {
            output_json(['status' => false, 'code' => '401']);
            return $response;
        }

        $user_id = $this->curr_user->id;

        $this->load->model('donor_model');
        $data = $this->donor_model->getNewDonorsZapierPoll($user_id);

        http_response_code(200);
        output_json($data);
    }
    
    public function get_new_subscriptions() {
        $response = $this->auth('resource');
        if ($response === false) {
            output_json(['status' => false, 'code' => '401']);
            return $response;
        }

        $user_id = $this->curr_user->id;

        $this->load->model('subscription_model');
        $data = $this->subscription_model->getNewSubscriptionsZapierPoll($user_id);

        http_response_code(200);
        output_json($data);
    }
    
    public function get_expired_sources() {
        $response = $this->auth('resource');
        if ($response === false) {
            output_json(['status' => false, 'code' => '401']);
            return $response;
        }

        $user_id = $this->curr_user->id;

        $this->load->model('sources_model');
        $data = $this->sources_model->getExpiredSourcesZapierPoll($user_id);

        http_response_code(200);
        output_json($data);
    }

}
