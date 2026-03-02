<?php

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

require_once 'application/libraries/messenger/MessengerProvider.php';

class Twilio_tasks extends My_Controller {

    private $MessengerInstance;

    function __construct() {
        parent::__construct();

        MessengerProvider::init(PROVIDER_MESSENGER_TWILIO);
        $this->MessengerInstance = MessengerProvider::getInstance();
    }

    public function message_come_in_webhook() {

        $test = 0;
        if ($test) {
            // ---- for testing only, using postman we send a raw json object but twilio sends a post request where we can access directly with $_REQUEST
            $input_test = @file_get_contents('php://input');
            $_REQUEST   = json_decode($input_test, true);
            // -----------------------------------------------
        }

        require_once 'application/libraries/messenger/MessengerProvider.php';
        MessengerProvider::init(PROVIDER_MESSENGER_TWILIO);
        $TwilioInstance = MessengerProvider::getInstance();

        if (!isset($_REQUEST['To']) || !$_REQUEST['To']) {
            echo $TwilioInstance->msgResponse('Invalid request');
            return;
        }
        
        $to = $_REQUEST['To'];

        $this->load->model('organization_model');

        $church = $this->organization_model->getWhere('client_id', ['twilio_phoneno' => $to], false, 'ch_id desc');
        $church = $church ? (object) $church[0] : null;

        if (!$church) {
            echo $TwilioInstance->msgResponse('You are not associated with this organization.');
        } else {

            require_once 'application/libraries/gateways/PaymentsProvider.php';

            $dash_user = $this->db->where('id', $church->client_id)->select('id, email, payment_processor')->get('users')->row();

            if ($dash_user->payment_processor === PROVIDER_PAYMENT_EPICPAY_SHORT) {
                PaymentsProvider::init(PROVIDER_PAYMENT_EPICPAY);
            } else if ($dash_user->payment_processor === PROVIDER_PAYMENT_PAYSAFE_SHORT) {
                PaymentsProvider::init(PROVIDER_PAYMENT_PAYSAFE);
            }
            $PaymentInstance = PaymentsProvider::getInstance();
            $PaymentInstance->processTwilioRequest();
        }
    }

    //===== CHURCHES TWILIO NUMBERS CLOSING ROUTINE
    //=========================================================================================
    //===== maintenance()
    //===== @option "list" it just list things without changing data
    //===== @option "run" it will execute the close call to the twilio API    
    //=========================================================================================
    //=========================================================================================
    //===== WARNING !!! DO NOT EXECUTE THIS SCRIPT USING "run" option FROM YOUR LOCALHOST, 
    //===== IT MUST BE RAN ON PRODUCTION ONLY AS THE RELATIONS ARE WITH THE PRODUCTION DATABASE
    //===== FOR LOCALHOST TESTING USE "list" OPTION

    public function maintenance($option) {

        if(!is_cli()) {
            exit('No direct script access allowed');
        }
        
        if (!in_array($option, ['list', 'run'])) {
            die;
        }

        log_message("error", "_INFO_LOG TWILIO NUMBERS MAINTENANCE started at:" . date("Y-m-d H:i:s"));

        ini_set('max_execution_time', 500);
        set_time_limit(500);

        $this->close_mapped_subaccounts($option);

        $removeNotMapped = true;

        if ($removeNotMapped) {
            $notMappedSids = $this->get_not_mapped_subaccounts();
            $this->close_not_mapped_subaccounts($notMappedSids, $option);
        }

        log_message("error", "_INFO_LOG TWILIO NUMBERS MAINTENANCE ended at:" . date("Y-m-d H:i:s"));
    }

    private function close_mapped_subaccounts($option = "list") {

        echo "close_mapped_subaccounts ======================================================";
        echo "<br>";

        $churches = $this->db->query("
            SELECT c.* FROM church_detail c
            WHERE TRUE
            AND c.twilio_accountsid IS NOT NULL
            AND NOT c.twilio_accountsid <=> ''
            AND NOT c.twilio_accountsid <=> '" . TWILIO_ACCOUNT_SID_LIVE . "'
            ORDER BY c.ch_id desc
            ")->result();

        $keepAlive = 0;
        $toCancel  = 0;

        $today              = date("Y-m-d");
        $startFromPHPString = "-3 months";
        $since              = date("Y-m-d", strtotime($today . " " . $startFromPHPString));

        echo "<b>SMS Usage since " . $since . "</b><br>";

        foreach ($churches as $church) {
            try {
                $uResult = $this->MessengerInstance->get_sub_account_usage($church->twilio_accountsid, $startFromPHPString);
                if (strtotime($uResult["accountDateCreated"]) >= strtotime($since) || $uResult["total"]) {
                    $keepAlive++;
                    echo "ChurchID $church->ch_id $church->church_name <span style='color:yellowgreen'><b>Keep Alive | Total $uResult[total] | Twilio Account since: $uResult[accountDateCreated]</b></span><br>";
                } else {
                    $toCancel++;
                    echo "ChurchID $church->ch_id $church->church_name <span style='color:red'><b>Cancel Account | Total $uResult[total] | Twilio Account since: $uResult[accountDateCreated]</b></span><br>";

                    if ($option === "run") {
                        $status                         = $this->MessengerInstance->close_sub_account($church->twilio_accountsid);
                        $cancel_data["status"]          = $status;
                        $cancel_data["_datetime_event"] = date('Y-m-d H:i:s');

                        $save_resp = [];
                        if ($church->twilio_cancel_data) {
                            $save_resp = json_decode($church->twilio_cancel_data);
                        }

                        if ($status == "closed") {
                            
                            log_message("error", "_INFO_LOG Twilio SubAccount closed | church_id: " . $church->ch_id);
                            
                            echo "<br><b>Account Closed</b><br>";
                            $cancel_data["twilio_accountsid"] = $church->twilio_accountsid;
                            $cancel_data["twilio_phonesid"]   = $church->twilio_phonesid;
                            $cancel_data["twilio_phoneno"]    = $church->twilio_phoneno;
                            $cancel_data["twilio_token"]      = $church->twilio_token;
                            
                            $save_resp[]                      = $cancel_data;
                            $this->db->where('ch_id', $church->ch_id)
                                    ->update('church_detail', [
                                        "twilio_accountsid"  => null,
                                        "twilio_phonesid"    => null,
                                        "twilio_phoneno"     => null,
                                        "twilio_token"       => null,
                                        "twilio_cancel_data" => json_encode($save_resp)
                            ]);
                        } else {
                            $save_resp[] = $cancel_data;
                            $this->db->where('ch_id', $church->ch_id)
                                    ->update('church_detail', ["twilio_cancel_data" => json_encode($save_resp)]);
                        }
                    }
                }
            } catch (Exception $exc) {
                $message   = "Cancel Twilio subAccount Process ChurchID $church->ch_id $church->church_name. error found" . " |  " . $exc->getMessage();
                echo $message . "<br>";
                log_message("error", $message);
                $save_resp = [];
                if ($church->twilio_cancel_data) {
                    $save_resp = json_decode($church->twilio_cancel_data);
                }
                $save_resp[] = $exc->getMessage();
                $this->db->where('ch_id', $church->ch_id)
                        ->update('church_detail', [
                            "twilio_cancel_data" => json_encode($save_resp)
                ]);
            }
        }
        echo "Keep Alive: $keepAlive | Cancel: $toCancel<br>";
    }

    //==================================================================================================================================
    //==== get twilio accounts not found in our database

    private function get_not_mapped_subaccounts() {
        echo "<br><br>";
        echo "get_not_mapped_subaccounts ======================================================";
        echo "<br>";

        $notMappedSids = [];
        try {
            $accounts = $this->MessengerInstance->get_sub_accounts();
            echo count($accounts) . " -1 ";
            foreach ($accounts as $record) {

                if ($record->sid == TWILIO_ACCOUNT_SID_LIVE) { //Warning this account is the parent one, not evaluated for closing
                    echo "Main: " . 'XXXXXXXX' . "<br>";
                    echo "Skipping Main Twilio Account ...<br>===================<br><br>";
                    continue;
                }
                echo $record->sid . "<br>";
                $church = $this->db->where("twilio_accountsid", $record->sid)->get("church_detail")->row();
                if (!$church) {
                    echo "Not Mapped<br>";
                    $notMappedSids[] = $record->sid;
                } else {
                    echo "$church->church_name mapped<br>";
                }
                echo "===================<br><br>";
            }
        } catch (Exception $exc) {
            echo $exc->getMessage() . "<br>";
            //log_message("error", $message);
        }
        echo "<br><br>NOT MAPPED TOTAL: " . count($notMappedSids) . " JSON ENCODED<br><br>";
        echo json_encode($notMappedSids);

        echo "<br><br>COMMA SEPARATED: <br><br>";
        foreach ($notMappedSids as $srow) {
            echo "'$srow',<br>";
        }

        return $notMappedSids;
    }

    //====================================================================================================================================
    //==== close twilio accounts not found in our database, it's is useful when an entire organization is removed from church_detail table

    private function close_not_mapped_subaccounts($sIds, $option = "list") {
        echo "<br><br>";
        echo "close_not_mapped_subaccounts ======================================================";
        echo "<br>";

        foreach ($sIds as $sId) {
            try {
                if ($option === "list") {
                    echo "<br>$sId Account To Close<br>";
                } elseif ($option === "run") {
                    $status = $this->MessengerInstance->close_sub_account($sId);
                    if ($status == "closed") {
                        log_message("error", "_INFO_LOG Twilio SubAccount closed | not_mapped");
                        echo "<br>$sId <b>Account Closed</b><br>";
                    } else {
                        echo "<br>$sId <b>Account NOT Closed</b><br>";
                    }
                }
            } catch (Exception $exc) {
                $message = "Cancel Unmapped Twilio subAccount Process ChurchID $sId error found" . " |  " . $exc->getMessage();
                echo $message . "<br>";
                log_message("error", $message);
            }
        }
    }

}
