<?php

if (!defined('BASEPATH'))
    exit('No direct script access allowed');

require 'application/vendor/autoload.php';

use Twilio\Rest\Client;
use Twilio\TwiML\MessagingResponse;

class TwilioRoot implements IMessengerProvider {

    private $client;

    public function __construct() {
        $this->base_url       = BASE_URL;
        $this->base_url       = 'https://app.lunarpay.com/';
        $this->client         = new Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
        $this->default_number = '';
    }

    function get_available_numbers($data) {
        //$near_number = $data->near_number;
        $country = $data->country;
        $state = $data->state;

        $available_numbers = [];

        $repeated_ctrl = [];
        /*
          try {
          //==== 1st priority, reading near numbers
          $numbers = $this->client->availablePhoneNumbers('US')->local->read(["SmsEnabled" => "true", "nearNumber" => $near_number], 15);


          foreach ($numbers as $record) {
          $available_numbers []                = ['value' => $record->phoneNumber, 'text' => $record->friendlyName];
          $repeated_ctrl[$record->phoneNumber] = $record->phoneNumber;
          }
          } catch (Exception $ex) {

          }
         */
        try {            
            //==== 2nd priority, state zone
            if($country == 'US') {
                $numbers = $this->client->availablePhoneNumbers('US')->local->read(["SmsEnabled" => "true", "inRegion" => $state], 5);
            } else {
                $numbers = $this->client->availablePhoneNumbers($country)->local->read(["SmsEnabled" => "true"], 5);
            }
            
            foreach ($numbers as $record) {
                if (!isset($repeated_ctrl[$record->phoneNumber])) {
                    $available_numbers [] = ['value' => $record->phoneNumber, 'text' => $record->friendlyName];
                }
            }
        } catch (Exception $ex) {
            
        }

        return $available_numbers;
    }
    
    function createno($name = null, $number = null,$country = 'US') {

        $account = $this->client->api->accounts->create(array(
            'FriendlyName' => $name
        ));

        if (!$number) {
            $numbers         = $this->client->availablePhoneNumbers($country)->local->read(array("SmsEnabled" => "true"));
            $selected_number = $numbers[0]->phoneNumber;
        } else {
            $selected_number = $number;
        }

        $response = $this->client->api->accounts($account->sid)->incomingPhoneNumbers->create([
            "phoneNumber" => $selected_number,
            "SmsUrl"      => $this->base_url . "twilio_tasks/message_come_in_webhook",
            "SmsMethod"   => "POST"
        ]);

        return $response;
    }

    public function get_sub_account($sId) {
        $account = $this->client->api->v2010->accounts($sId)->fetch();
        return $account;
    }
    
    function get_sub_accounts() {
        $accounts = $this->client->api->v2010->accounts->read(array("status" => "active"), 999);
        return $accounts;
    }
    
    public function get_sub_account_usage($sId, $startFromPHPString = "-3 months") {

        $account = $this->client->api->v2010->accounts($sId)->fetch();

        $authToken = $account->__get("authToken");
        $accountDateCreated = $account->__get("dateCreated");
        $accountDateCreated = $accountDateCreated->format("Y-m-d");

        $this->sClient = new Client($sId, $authToken);
        $endDate = date("Y-m-d");
        $startDate = date("Y-m-d", strtotime($endDate . " " . $startFromPHPString));
        $settings = [
            "category" => "sms", /* WHEN USING CATEGORY RECORS COUNT WILL BE GROUPED */
            "startDate" => $startDate,
            "endDate" => $endDate
        ];

        $records = $this->sClient->usage->records->read($settings);

        $total = 0;
        foreach ($records as $record) {
            $total += $record->count;
        }

        $result = [
            "total" => $total,
            "accountDateCreated" => $accountDateCreated
        ];

        return $result;
    }
    
    public function close_sub_account($sId) {

        /* --- Permanently Close a Subaccount --- */

        $account = $this->client->api->v2010->accounts($sId)->update(array("status" => "closed"));
        $status = $account->__get("status");
        return $status;
    }

    public function msgResponse($msg) {
        $response = new MessagingResponse();
        $response->message($msg);

        return $response;
    }

    public function setClient($sid, $token){
        $this->client = new Client($sid, $token);
    }

    public function sendSms($to, $from, $message, $callback = false) {                
        if (!$callback) {
            $response = $this->client->messages->create($to, [
                'from' => $from,
                'body' => $message
                    ]);
        } else {
            $response = $this->client->messages->create($to, [
                'from' => $from,
                'body' => $message,
                //'statusCallback' => 'https://manage.churchbase.com/callback_twillo.php'
                    ]
            );
        }
        return $response;
    }

}
