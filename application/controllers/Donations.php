<?php

defined('BASEPATH') OR exit('No direct script access allowed');

require_once 'application/controllers/extensions/Payments.php';

class Donations extends My_Controller {

    public $data = [];

    public function __construct() {
        parent::__construct();

        if (!$this->ion_auth->logged_in()) {
            redirect('auth/login', 'refresh');
        }

        $this->template_data['view_index'] = $this->router->fetch_class() . '/' . $this->router->fetch_method();
        $this->load->use_theme();

        $this->load->library('form_validation'); //used for creating forms
        
        $this->load->model('donation_model');
    }

    // ---- Receives fund_id optionally, for loading transactions linked to that fund
    public function index($fund_id = null) {

        $this->template_data['title'] = langx("Transactions");

        //Getting is_new_donation_before_days data
        $this->load->model('setting_model');
        
        $user_id           = $this->session->userdata('user_id');
        $user = $this->db->select('payment_processor')->where('id', $user_id)->get('users')->row();
        
        $this->load->model('product_model');
        if($user->payment_processor == PROVIDER_PAYMENT_EPICPAY_SHORT){
            $this->load->helper('epicpay');
            $this->template_data['subs_freqs'] = Product_model::PERIODICALLY_STRINGS;
        }elseif($user->payment_processor == PROVIDER_PAYMENT_PAYSAFE_SHORT){
            $this->load->helper('paysafe');
            $this->template_data['subs_freqs'] = Product_model::PERIODICALLY_STRINGS;
        }elseif($user->payment_processor == PROVIDER_PAYMENT_FORTIS_SHORT){
            //$this->load->helper('fortis');
            $this->template_data['subs_freqs'] = Product_model::PERIODICALLY_STRINGS;
        }
        
        //Remove this line, unused
        $this->template_data['is_new_donor_before_days'] = $this->setting_model->getItem('is_new_donor_before_days');
        $this->template_data['fund_id']                  = $fund_id;

        $view = $this->load->view('donation/donation', ['view_data' => $this->template_data], true);

        $this->template_data['content'] = $view;

        $this->load->view('main', $this->template_data);
    }

    public function get_donations_dt() {
        output_json($this->donation_model->getDt(), true);
    } 
     
    public function export_donations_csv() {
        $dt = json_decode($this->donation_model->getDt(),true);
        $export_data = [];
        $export_data[] = ['id' => 'ID', 'amount' => 'AMOUNT', 'fee' => 'FEE', 'net' => 'NET', 'customer' => 'CUSTOMER', 'email' => 'EMAIL', /*'fund' => 'FUND',*/ 'giving_source' => 'SOURCE', 'method' => 'METHOD', 'status' => 'STATUS', 'transaction_detail' => 'DETAILS', 'date' => 'DATE TIME'];
        foreach ($dt['data'] as $donation){
            $item                       = [];
            $item['id']                 = $donation['id'];
            $item['amount']             = $donation['amount'] ? $donation['amount'] : 0.0;
            $item['fee']                = $donation['fee'] ? $donation['fee'] : 0.0;
            $item['net']                = $donation['net'] ? $donation['net'] : 0.0;
            $item['customer']           = $donation['name'];
            $item['email']              = $donation['email'];
            //$item['fund']               = $donation['fund'];
            $item['giving_source']      = $donation['giving_source'];
            
            $status = $donation['status'];
            $src = $donation['src'];
            $manual_failed = $donation['manual_failed'];
            $trx_type = $donation['trx_type'];
            $status_ach = $donation['status_ach'];
            $subscription = $donation['subscription'];
            $substatus = $donation['substatus'];
            $manual_trx_type = $donation['manual_trx_type'];
            
            $itemSatusStr = '-';
            
            if ($manual_trx_type) {
                if ($status == 'P') {
                    $itemSatusStr = 'Succeeded';
                }
            } else if ($src == 'CC') {
                if ($status == 'P') {
                    if ($trx_type == 'Donation' && $manual_failed == '1') {
                        $itemSatusStr = 'Marked as failed';
                    } else if ($trx_type == 'Refunded') {
                        $itemSatusStr = 'Refunded';
                    } else if ($trx_type == 'Recovered') {
                        $itemSatusStr = 'Recovered';
                    } else {
                        $itemSatusStr = 'Succeeded';
                    }
                }
            } else if ($src == 'BNK') {
                if ($trx_type == 'Donation' && $manual_failed == '1') {
                    $itemSatusStr = 'Marked as failed';
                } else if ($status == 'P' && $trx_type == 'Donation') {
                    if ($status_ach == 'P') {
                        $itemSatusStr = 'Succedded';
                    } else if ($status_ach == 'W') {
                        $itemSatusStr = 'In Progress';
                    }
                } else if ($status == 'P' && $trx_type == 'Refunded') {
                    $itemSatusStr = 'Refunded';
                } else if ($status == 'P' && $trx_type == 'Recovered') {
                    $itemSatusStr = 'Recovered';
                } else if ($status == 'N') {
                    $itemSatusStr = 'Not processed';
                }
            }
            if ($subscription != null && $subscription > 0 && $substatus == 'D') {
                $itemSatusStr .= ' (Subscription canceled)';
            }
            
            $item['method'] = $donation['method'] . ($manual_trx_type ? '/' . $manual_trx_type : '');                        
            $item['status'] = $itemSatusStr;
            $item['transaction_detail'] = $donation['transaction_detail'];

            $item['date']  = $donation['created_at'];
            $export_data[] = $item;
        }
        exports_data_csv('donations', $export_data);
    }

    public function get_max_amount() {
        output_json($this->donation_model->getMaxAmount());
    }

    public function refund() {
        
        $transaction_id = $this->input->post("transaction_id");       
        $user_id        = $this->session->userdata('user_id');
        $pResult        = Payments::refund($transaction_id, $user_id);
        
        output_json([
            'status'  => $pResult['status'],
            'message' => $pResult['message']
        ]);
    }

    public function toggle_bank_trxn_status() {
        
        $transaction_id = $this->input->post("transaction_id");
        $user_id        = $this->session->userdata('user_id');
        $pResult        = Payments::toggle_bank_trxn_status($transaction_id, $user_id);

        output_json([
            'status'  => $pResult['status'],
            'message' => $pResult['message']
        ]);
    }
    
    //================ recurring/subscriptions

    public function recurring() {
        $this->template_data['title'] = langx("recurring");

        //Getting is_new_donation_before_days data
        $this->load->model('setting_model');
        
        $user_id           = $this->session->userdata('user_id');
        $user = $this->db->select('payment_processor')->where('id', $user_id)->get('users')->row();
        
        $this->load->model('product_model');
        if($user->payment_processor == PROVIDER_PAYMENT_EPICPAY_SHORT){
            $this->load->helper('epicpay');
            $this->template_data['subs_freqs'] = Product_model::PERIODICALLY_STRINGS;
        }elseif($user->payment_processor == PROVIDER_PAYMENT_PAYSAFE_SHORT){
            $this->load->helper('paysafe');            
            $this->template_data['subs_freqs'] = Product_model::PERIODICALLY_STRINGS;
        }elseif($user->payment_processor == PROVIDER_PAYMENT_FORTIS_SHORT){
            //$this->load->helper('fortis');
            $this->template_data['subs_freqs'] = Product_model::PERIODICALLY_STRINGS;
        }
        
        $view = $this->load->view('donation/recurring', ['view_data' => $this->template_data], true);

        $this->template_data['content'] = $view;

        $this->load->view('main', $this->template_data);
    }
    
    public function get_subscriptions_dt() {
        $this->load->model('subscription_model');
        
        output_json($this->subscription_model->getDt(), true);
    }

    public function stop_subscription() {
        
        $subscription_id = $this->input->post("subscription_id");
        $user_id        = $this->session->userdata('user_id');
        $pResult        = Payments::stopSubscription($subscription_id, $user_id);

        output_json([
            'status'  => $pResult['status'],
            'message' => $pResult['message']
        ]);        
    }
    
    // ---- Code model
    public function save_transaction() {
        
        try {
            $data = $this->input->post();

            // ---- $this->donation_model->valAsArray = true;            

            $result = $this->donation_model->save_transaction($data);

            output_json($result);
        } catch (Exception $ex) {

            // ---- if $this->donation_model->valAsArray = true 
            // ---- we need to send the $ex->getMessage() as an one element array, without the stringifyFormatErrors 
            // ---- thinking in the future, we may use this if we install an API

            output_json(['status' => false, 'errors' => stringifyFormatErrors([$ex->getMessage()]), 'exception' => true]);
        }
    }

    public function create_internal_subscription() {
        
        //
        $this->load->model('subscription_model');

        try {
            $data = $this->input->post();

            // ---- $this->donation_model->valAsArray = true;            

            $result = $this->subscription_model->createInternal($data);

            output_json($result);
        } catch (Exception $ex) {

            // ---- if $this->donation_model->valAsArray = true 
            // ---- we need to send the $ex->getMessage() as an one element array, without the stringifyFormatErrors 
            // ---- thinking in the future, we may use this if we install an API

            output_json(['status' => false, 'errors' => stringifyFormatErrors([$ex->getMessage()]), 'exception' => true]);
        }
    }
    
    public function remove_transaction() {
        
        try {
            $data   = $this->input->post();
            $result = $this->donation_model->remove_transaction($data);
            output_json($result);
        } catch (Exception $ex) {
            output_json(['status' => false, 'errors' => stringifyFormatErrors([$ex->getMessage()]), 'exception' => true]);
        }
    }
    
    public function detail($id) {

        $this->template_data['title'] = langx("transaction");

        $trxn = $this->donation_model->getTransactionFullPackage($id);
        
        if (is_object($trxn)) {

            $this->template_data['detail'] = $trxn;

            $view = $this->load->view('donation/detail', ['view_data' => $this->template_data], true);

            $this->template_data['content'] = $view;

            $this->load->view('main', $this->template_data);
        } else {
            show_404();
        }
    }

    public function profile_recurring($id) {

        $this->load->model('subscription_model');

        $this->template_data['title'] = langx("Recurring");

        $profile = $this->subscription_model->getIdSubscriptions($id);

        if (is_object($profile)) {

            $this->template_data['profile'] = $profile;

            $view = $this->load->view('donation/profile_recurring', ['view_data' => $this->template_data], true);

            $this->template_data['content'] = $view;

            $this->load->view('main', $this->template_data);
        } else {
            show_404();
        }
    }

}
