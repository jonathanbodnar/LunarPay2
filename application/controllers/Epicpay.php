<?php

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

require_once 'application/libraries/gateways/PaymentsProvider.php';

class Epicpay extends My_Controller {

    function __construct() {
        parent::__construct();
        die;
    }

    //cron checking for organization approval
    public function process_verify_organization_cron() {

        //log_message("error", "_INFO_LOG /epicpay/process_verify_organization_cron run " . date("Y-m-d H:i:s"));

        PaymentsProvider::init();
        $PaymentInstance = PaymentsProvider::getInstance();
        $PaymentInstance->processVerifyOrganizationCron();
    }

    //epicpay will be firing us here
    public function process_webhooks($opt = false) {

        log_message("error", "_INFO_LOG /EpicPay/processWebHooks/$opt run " . date("Y-m-d H:i:s"));

        $input_test      = @file_get_contents('php://input');
        $event_json_test = json_decode($input_test);

        $this->db->insert('epicpay_webhooks_backup', [
            'created_at' => date('Y-m-d H:i:s'),
            'option'     => $opt ? $opt : "none",
            'event_json' => json_encode($event_json_test)
        ]);

        $headers = get_headers_safe();

        if (!isset($headers['authorization']) || strpos($headers['authorization'], 'Basic ') !== 0) {
            http_response_code(401);
            die;
        }

        $authSplit = explode(':', base64_decode(explode(' ', $headers['authorization'])[1]), 2);

        if (count($authSplit) != 2 || $authSplit[0] != $this->config->item('pty_epicpay_wh_username') || $authSplit[1] != $this->config->item('pty_epicpay_wh_password')
        ) {
            http_response_code(401);
            die;
        }


        if ($opt === 'orgn_approval') {
            $input      = @file_get_contents('php://input');
            $event_json = json_decode($input);

            $this->db->insert('epicpay_webhooks', [
                'created_at' => date('Y-m-d H:i:s'),
                'event_json' => json_encode($event_json)
            ]);
        } elseif ($opt === "sub_trnx") {
            $input      = @file_get_contents('php://input');
            $event_json = json_decode($input);
            if (isset($event_json->result->payment->subscription_id) && $event_json->result->payment->subscription_id) {

                $epicpaySubId = str_replace("-", "", $event_json->result->payment->subscription_id);
                $subscription = $this->db->where("epicpay_subscription_id", $epicpaySubId)->get('epicpay_customer_subscriptions')->row();

                if ($subscription) {
                    $amount = round($event_json->result->payment->amount / 100, 2);

                    $transactionData = [
                        'customer_id'            => $subscription->customer_id ? $subscription->customer_id : 0,
                        'customer_source_id'     => $subscription->customer_source_id ? $subscription->customer_source_id : 0,
                        'church_id'              => $subscription->church_id,
                        'campus_id'              => $subscription->campus_id,
                        'account_donor_id'       => $subscription->account_donor_id ? $subscription->account_donor_id : null,
                        'total_amount'           => $amount,
                        'first_name'             => $subscription->first_name,
                        'last_name'              => $subscription->last_name,
                        'email'                  => $subscription->email,
                        'zip'                    => $subscription->zip,
                        'giving_source'          => $subscription->giving_source,
                        'multi_transaction_data' => $subscription->multi_transaction_data,
                        'campaign_id'            => $subscription->campaign_id,
                    ];

                    $trx               = new stdClass();
                    $trx->total_amount = $amount;
                    $trx->template     = $subscription->epicpay_template;
                    $trx->src          = $subscription->src;

                    $this->load->helper('epicpay');
                    $transactionData['fee']              = getEpicPayFee($trx);
                    $transactionData['sub_total_amount'] = $transactionData['total_amount'] - $transactionData['fee'];

                    $transactionData['template']       = $subscription->epicpay_template;
                    $transactionData['is_fee_covered'] = $subscription->is_fee_covered;
                    $transactionData['src']            = $subscription->src;
                    $transactionData['status_ach']     = $subscription->src == "BNK" ? "W" : null;

                    $transactionData['epicpay_customer_id']      = $subscription->epicpay_customer_id;
                    $transactionData['epicpay_wallet_id']        = $subscription->epicpay_wallet_id;
                    $transactionData['epicpay_transaction_id']   = isset($event_json->result->payment->transaction_id) ? $event_json->result->payment->transaction_id : null;
                    $transactionData['status']                   = $this->getWhTrnxStatus($event_json);
                    $transactionData['tags']                     = $subscription->tags;
                    $transactionData['customer_subscription_id'] = $subscription->id;
                    $transactionData['created_at']               = date('Y-m-d H:i:s');
                    $transactionData['updated_at']               = date('Y-m-d H:i:s');
                    $transactionData['request_response']         = $input;

                    $this->db->insert('epicpay_customer_transactions', $transactionData);
                    $trxId                    = $this->db->insert_id();
                    $transactionData["trxId"] = $trxId;

                    $trnx_funds = $this->db->where('subscription_id', $subscription->id)->get('transactions_funds')->row();
                    $fund_id    = $trnx_funds->fund_id;

                    $this->load->model('transaction_fund_model', 'trnx_funds');
                    $trnxFundData = [
                        'transaction_id' => $trxId,
                        'fund_id'        => $fund_id,
                        'amount'         => $transactionData['total_amount'],
                        'fee'            => $transactionData['fee'],
                        'net'            => $transactionData['sub_total_amount']
                    ];

                    $this->trnx_funds->register($trnxFundData);

                    $from_subscription["created_at"] = date("m/d/y", strtotime($subscription->created_at));
                    $from_subscription["frequency"]  = ucfirst(strtolower($subscription->frequency));

                    //===== If ACH we will update it on cronJob
                    if ($transactionData['status'] == 'P' && $transactionData['src'] == 'CC') {
                        //if ($transactionData['campaign_id']) {
                        //$this->updateCampaign($transactionData);
                        //}
                        $this->load->model('donor_model');
                        $donationAcumData = [
                            'id'          => $transactionData['account_donor_id'],
                            'amount_acum' => $transactionData['total_amount'],
                            'fee_acum'    => $transactionData['fee'],
                            'net_acum'    => $transactionData['sub_total_amount']
                        ];

                        $this->donor_model->updateDonationAcum($donationAcumData);

                        $this->load->helper('emails');
                        sendDonationEmail($transactionData, $from_subscription, $fund_id);
                    }
                }
            }
        } else {
            http_response_code(401);
            die;
        }

        http_response_code(200);
    }

    public function merchant_appcomplete($churchId = 0) {

        if (!$churchId) {
            echo 'Invalid request';
            die;
        }

        if (!$this->ion_auth->logged_in()) {
            die;
        }

        $church = $this->db->where('ch_id', $churchId)->where('client_id', $this->session->userdata('user_id'))
                        ->get('church_detail')->row();

        if (empty($church)) {
            echo 'Invalid church. Please try again';
            die;
        }

        $this->load->use_theme();

        $slug = strtolower(str_replace(' ','-',trim($church->church_name)));
        $this->load->model('organization_model');
        $orgnx = $this->organization_model->getBySlug($slug);
        if($orgnx){
            $slug .= '-'.$churchId;
        }

        $this->db->where('ch_id', $churchId)->update('church_detail', [
            'epicpay_verification_status' => 'P',
            'slug' => $slug
        ]);


        $view_data = [
            "message"  => 'Your application was sent, please go to <strong><a style="color:white; text-decoration:underline" href="' . base_url() . 'organizations">' . 'Organizations' . '</a></strong> for checking your <strong>verification status</strong>',
            "message2" => '',
            "type"     => "info"
        ];


        $view['content'] = $this->load->view('organization/merchant_appcomplete', $view_data, true);
        $this->load->view('main_clean', $view);
    }

    public function ach_rejects_cron() {
        die;
        //this report is disabled we are getting a deny response from epicpay
        
        display_errors();

        log_message("error", "_INFO_LOG ach_rejects_cron script starts at:" . date("Y-m-d H:i:s"));

        require_once 'application/libraries/gateways/PaymentsProvider.php';
        PaymentsProvider::init(PROVIDER_PAYMENT_EPICPAY);
        $PaymentInstance = PaymentsProvider::getInstance();

        $PaymentInstance->setTesting(false);

        $today      = date("Y-m-d");
        $start_from = date("Y-m-d", strtotime($today . " -20 days"));

        /* --- GET THE CHURCHES WITH ACH TRANSACTIONS FROM $start_from  --- */
        $q1 = ""
                . "SELECT c.*, t.`status`, t.status_ach
                FROM `church_detail` c
                INNER JOIN epicpay_customer_transactions t ON t.church_id = c.ch_id
                WHERE TRUE 
                AND c.`epicpay_credentials` IS NOT NULL 
                AND c.`epicpay_verification_status` = 'V' 
                AND t.`status` = 'P' AND t.src = 'BNK'
                AND NOT t.`status_ach` <=> 'N'
                AND t.created_at >= '$start_from' AND t.created_at <= '$today'
                GROUP BY ch_id
                ORDER BY ch_id DESC";

        $churchs_with_achtrnxs = $this->db->query($q1)->result();

        foreach ($churchs_with_achtrnxs as $church) {

            $requestBody = [
                "start_date" => $start_from,
                "end_date"   => $today
            ];

            $result = $PaymentInstance->generalReport($church->ch_id, $requestBody, "achrejects");

            if (isset($result["result"]->record_count) && $result["result"]->record_count) {
                foreach ($result["result"]->data as $reject) {
                    $reject->routing_number = null;
                    $reject->account_no     = null;

                    $r_data = [
                        "ach_reject_response" => json_encode($reject),
                        "updated_at"          => date("Y-m-d H:i:s")
                    ];

                    //======== Mark transaction with ACH "Reject" and special NOC Codes as success | CODES:
                    $NOC_codes_white_list = ['c01', 'c02', 'c03', 'c05'];
                    $reject_reason_code   = strtolower($reject->reason_code);
                    if (in_array($reject_reason_code, $NOC_codes_white_list)) {
                        //======= Go ahead do not mark this transaction as rejected, save the response only, 
                        //======= it has only a warning that the payment processor will handle                        
                    } else {
                        $r_data["status_ach"] = "N"; //TOTAL REJECT
                        $r_data["status"]     = "N"; //Trnxs no success
                    }

                    $this->db->where("church_id", $church->ch_id)
                            ->where("NOT status_ach <=> 'N'", null, false)
                            ->where("epicpay_transaction_id", $reject->trxn_id)
                            ->update("epicpay_customer_transactions", $r_data);

                    d($church->ch_id . "|" . $reject->trxn_id, false);
                }
            }
        }
        log_message("error", "_INFO_LOG ach_rejects_cron script end at:" . date("Y-m-d H:i:s"));
    }

    private function getDaysDiffBusinessDays(DateTime $startDate, DateTime $endDate) {
        $isWeekday = function (DateTime $date) {
            return $date->format('N') < 6;
        };

        $days = $isWeekday($endDate) ? 1 : 0;

        while ($startDate->diff($endDate)->days > 0) {
            $days      += $isWeekday($startDate) ? 1 : 0;
            $startDate = $startDate->add(new DateInterval("P1D"));
        }

        return $days;
    }

    public function ach_succeeded_cron() {
        display_errors();

        log_message("error", "_INFO_LOG ach_succeeded_cron script starts at:" . date("Y-m-d H:i:s"));

        $this->load->model('donor_model');
        $this->load->helper('emails');

        $mark_as_succeeded_after_days = 7; /* --- BUSINESS DAYS --- */

        $trnxs_with_w = $this->db->query(""
                        . "SELECT * FROM epicpay_customer_transactions "
                        . "WHERE "
                        . "status = 'P' AND src = 'BNK' AND status_ach = 'W' "
                        . "ORDER BY id desc"
                )->result();

        foreach ($trnxs_with_w as $trnx) {
            $dStart    = new DateTime($trnx->created_at);
            $dEnd      = new DateTime();
            $days_diff = $this->getDaysDiffBusinessDays($dStart, $dEnd);

            if ($days_diff >= $mark_as_succeeded_after_days) {
                $transactionData          = (array) $trnx;
                $transactionData['trxId'] = $transactionData['id'];

                //if ($transactionData['campaign_id']) {
                //$this->updateCampaign($transactionData);
                //}

                $from_subscription = false;
                if ($transactionData['customer_subscription_id']) {
                    $sub                             = $this->db->select('created_at, frequency')->where("id", $transactionData['customer_subscription_id'])->get("epicpay_customer_subscriptions")->result();
                    $from_subscription["created_at"] = date("m/d/y", strtotime($sub->created_at));
                    $from_subscription["frequency"]  = ucfirst(strtolower($sub->frequency));
                }

                $tfund   = $this->db->where('transaction_id', $trnx->id)->get('transactions_funds')->row();
                $fund_id = $tfund->fund_id;

                $donationAcumData = [
                    'id'          => $transactionData['account_donor_id'],
                    'amount_acum' => $transactionData['total_amount'],
                    'fee_acum'    => $transactionData['fee'],
                    'net_acum'    => $transactionData['sub_total_amount']
                ];

                $this->donor_model->updateDonationAcum($donationAcumData);

                sendDonationEmail($transactionData, $from_subscription, $fund_id);

                $this->db->where("id", $trnx->id)->update("epicpay_customer_transactions", [
                    "status_ach" => "P",
                    "updated_at" => date("Y-m-d H:i:s")
                ]);
                d($trnx->church_id . "|" . $trnx->id . "|" . $transactionData['account_donor_id'], false);
            }
        }
        log_message("error", "_INFO_LOG ach_succeeded_cron script end at:" . date("Y-m-d H:i:s"));
    }

    //====== if the client has not finished filling the onboarding form in some time, send a zapier
    public function check_user_filled_onboard_form_cron($option = 'test') {

        //log_message("error", "_INFO_LOG check_user_filled_onboard_form_cron script starts at:" . date("Y-m-d H:i:s"));

        if ($option != 'run') {
            echo "<pre>TEST MODE (NO UPDATES)</pre>";
        }

        $HOURS_AFTER_NOTIFY = 2;

        $this->load->library('curl');
        $this->load->model('organization_model');
        $this->load->model('user_model');
        
        $orgnx = $this->organization_model->getWhere('ch_id, client_id, created_at, church_name', [
            'epicpay_verification_status' => 'N',
            'zapier_notify_not_completed' => null,
            'created_at is not null'      => null
        ]);

        $now        = strtotime('now');
        $total_send = 0;

        foreach ($orgnx as $row) {
            $seconds = $now - strtotime($row->created_at);
            $hours   = ($seconds / 60) / 60;

            if ($hours > $HOURS_AFTER_NOTIFY) {
                $user = $this->user_model->get($row->client_id);
                if($user) {
                    $zapier_data = [
                        "first_name"   => ucwords(strtolower($user->first_name)),
                        "last_name"    => ucwords(strtolower($user->last_name)),
                        "email"        => $user->email,
                        'phone'        => $user->phone,
                        'organization' => ucwords(strtolower($row->church_name ? $row->church_name : $user->company))];

                    $total_send++;

                    if ($option == 'run') {
                        if(ZAPIER_ENABLED) {
                            $url   = 'https://hooks.zapier.com/hooks/catch/8146183/okp4rx6/';
                            $this->curl->post($url, $zapier_data);                    
                            $this->organization_model->update(['ch_id' => $row->ch_id, 'zapier_notify_not_completed' => 1], $row->client_id);
                        }
                    }
                    echo "<pre>user id: $row->client_id | org id $row->ch_id</pre>";
                }
            }
        }

        echo "<pre>Total: $total_send</pre>";

        //log_message("error", "_INFO_LOG check_user_filled_onboard_form_cron script ends at:" . date("Y-m-d H:i:s") . " Total: $total_send");
    }

    private function getWhTrnxStatus($input) {
        //SUCCESS STATES      
        //reason_code: 000
        //response_code: Approved      
        //reason_code: 001
        //response_code: Received    
        /* --- ---- --- */
        if (isset($input->status->reason_code) && in_array($input->status->reason_code, ["000", "001"], TRUE)) {
            return 'P';
        } elseif (isset($input->status->response_code) && in_array($input->status->response_code, ["Approved", "Received"], TRUE)) {
            return 'P';
        }

        return 'N';
    }

}
