<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Messenger extends My_Controller {

    protected $twilio_phone_codes = TWILIO_AVAILABLE_COUNTRIES_NO_CREATION;

    public $data = [];

    public function __construct() {
        parent::__construct();

        $action = $this->router->method;
        $free = ['simulate_sms'];
        /* ------- ---------------- ------ */

        if (!in_array($action, $free)) {
            if (!$this->ion_auth->logged_in()) {
               redirect('auth/login', 'refresh');
            }
        }
    }

    public function createno() {

        $user_id   = $this->session->userdata('user_id');
        $church_id = $this->input->post('church_id');
        $country   = $this->input->post('country');
        $state     = $this->input->post('state');

        $this->load->model('organization_model');
        $orgnx = $this->organization_model->get($church_id, 'ch_id, twilio_accountsid', false, $user_id);

        if(!$this->twilio_phone_codes[$country]){
            output_json([
                "status" => false, "message" => 'Country not available'
            ]);
            return;
        }

        if($country === 'US' && (!$state || empty($state))){
            output_json([
                "status" => false, "message" => 'State not available'
            ]);
            return;
        }

        if (!$orgnx) {
            output_json([
                "status"  => false, "message" => 'Bad request'
            ]);
            return;
        }

        if ($orgnx && $orgnx->twilio_accountsid) {
            output_json([
                "status"  => false, "message" => 'Number already created for this organization'
            ]);
            return;
        }

        require_once 'application/libraries/messenger/MessengerProvider.php';
        MessengerProvider::init();
        $MenssengerInstance = MessengerProvider::getInstance();
        $numbers            = $MenssengerInstance->get_available_numbers((object) ['state' => $state,'country' => $country]);

        if (count($numbers) == 0) {
            output_json([
                "status"  => false, "message" => 'No numbers found, please try again'
            ]);
            return;
        }

        $number = $numbers[0]['value'];

        $response = $MenssengerInstance->createno(null, $number);

        if (!empty($response)) {
            $uResult   = $MenssengerInstance->get_sub_account($response->accountSid);
            $authToken = $uResult->__get("authToken");

            $save_data = [
                "twilio_accountsid"     => $response->accountSid,
                "twilio_phonesid"       => $response->sid,
                "twilio_phoneno"        => $response->phoneNumber,
                "twilio_country_code"   => $country,
                "twilio_country_number" => $this->twilio_phone_codes[$country]['code'],
                "twilio_token"          => $authToken
            ];

            $this->organization_model->update_twilio($church_id, $save_data);

            output_json([
                "status"  => true,
                "message" => 'Phone number successfully created'
            ]);
            return;
        }

        output_json([
            "status"  => false,
            "message" => 'An error ocurred attempting to to create the number'
        ]);
        return;
    }

    //------- method added for testing purposes
    public function simulate_sms($text = '') {
        die;
        require_once 'application/libraries/messenger/MessengerProvider.php';
        MessengerProvider::init();
        $MenssengerInstance = MessengerProvider::getInstance();
        
        $to = '+18302712452';
        $from = '(469) 484-7773';
        $message = str_replace('_', ' ', $text);
        
        $MenssengerInstance->setClient(TWILIO_ACCOUNT_SID_LIVE, TWILIO_AUTH_TOKEN_LIVE);
        $response = $MenssengerInstance->sendSms($to, $from, $message);
        
        d($response);
        
    }

}
