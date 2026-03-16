<?php

defined('BASEPATH') OR exit('No direct script access allowed');
function referral_CreateLink($ref){    
    return Referal_model::CODE_LINK_URL.$ref;
}
function referral_GetAffiliateEarnings($referral_user_id) {
    
    
    $CI     = & get_instance();
    
    // --- let's leave this here for debugging: 
    // --- $result = $CI->db->select('r.*, ch.church_name, t.total_amount')    
    
    $result = $CI->db->select('sum(t.total_amount) total_amount, count(t.id) trxn_count')
            ->where('r.user_id IS NOT NULL', null, false) // --- refferals registered on the system
            ->where('r.user_id', $referral_user_id) // --- reach affiliate's refferals
            ->join('church_detail ch', 'ch.client_id = r.user_id', 'inner')  // --- reach all orgnatizations from each referral
            ->join('epicpay_customer_transactions t', 't.church_id = ch.ch_id ' // --- reach transactions from each organization
                    . 'AND ((t.status = "P" AND t.src = "CC") OR t.status_ach = "P") ' // --- it is a "P" processed status, in other words, a success payment.
                    . 'AND t.trx_type = "DO" ' // --- positive transaction
                    . 'AND t.trx_ret_id IS NULL ' // --- it does NOT have been refunded
                    . 'AND t.manual_trx_type IS NULL '
                    . '', 'inner')
            ->get('referals r')
            ->row();

    $total_amount = isset($result->total_amount) && $result->total_amount ? $result->total_amount : 0;
    
    // ---- when the affiliates reaches one million we need to trigger here a new configuration for giving him 0.004 // we will be doing this later    
    
    $starting_percent = 0.002; // --- this is 0.2%
    $affiliate_earnings = round($total_amount * $starting_percent, 2);    
    
    return $affiliate_earnings;
}
class Referal_model extends CI_Model { //include suborgnx too

    public $valAsArray   = false;
    private $table     = 'referals';
    const CODE_LINK_URL= BASE_URL.'auth/register?ref=';
      //for getting validation errors as array or a string, false = string

    public function __construct() {
        parent::__construct();
    }

    private function beforeSave($data){
        if($data['full_name']){
            $data['full_name'] = ucwords(trimLR_Duplicates($data['full_name']));
        }  
        if($data['email']){
            $data['email'] = strtolower(trimLR_Duplicates($data['email']));
        }   
        return $data;
    }
  
    public function getDt() {
        $user_id  = $this->session->userdata('user_id');
        if (!$user_id) { 
            return ['status' => false, 'message' => ''];
        }
        $this->load->library("Datatables");

        $this->datatables->select("r.id, usr.referral_code, r.user_id, r.email, r.full_name, DATE_FORMAT(r.date_sent, '%m/%d/%Y') as date_sent_format, DATE_FORMAT(r.date_register, '%m/%d/%Y') as date_register_format,r.date_sent,r.date_register")
        ->join('users usr', 'usr.id = r.parent_id','inner')
        ->where('r.parent_id', $user_id)
        ->from($this->table . ' r');
                
        $this->datatables->add_column('_earnings', '$1', 'referral_GetAffiliateEarnings(user_id)'); 
        
        return $this->datatables->generate();
    }

    public function save($data, $user_id = false) {

        $val_messages    = [];

        $user_id  = !$user_id ? $this->session->userdata('user_id') : $user_id;
       
        if (!$user_id) { 
            return ['status' => false, 'message' => ''];
        }
        
        if(empty($data['email'])) {
            $val_messages [] = langx('Email field is required');
        }
        if(!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $val_messages [] = langx('A valid email is required');
        }
        if(empty($data['referal_message'])) {
            $val_messages [] = langx('Message field is required');
        }
        if(empty($data['full_name'])) {
            $val_messages [] = langx('Full name field is required');
        }
        if (!empty($val_messages)) {
            return [
                'status'  => false,
                'message' => langx('Validation error found'),
                'errors' => !$this->valAsArray ? stringifyFormatErrors($val_messages) : $val_messages
            ];
        }
        
        $data['user_id'] = $user_id;
        $data['orgName'] = $this->session->userdata()['currnt_org']['orgName'];

        if(!$this->getReferalByEmail($data['email'])){
            $data = $this->beforeSave($data);
            $this->db->insert($this->table, array(
                'parent_id'=>$user_id,
                'email'=>$data['email'],
                'referal_message' =>$data['referal_message'],
                'full_name'=>$data['full_name'],
                'date_sent'=>date('Y-m-d H:i:s')
            ));
        }
        $this->load->helper('emails');
        $data['orgName'] = $this->session->userdata('currnt_org')['orgName'];
        $result = shareReferalCode($data);
        return [
            'status'       => true,
            'message'      => langx('Email Sent'),
            'emailResponse' => $result
        ];
    }

    public function getReferalByEmail($email) {
        $this->db->select("id")
        ->where('email', $email)
        ->from($this->table. ' l');
        return $this->db->get()->row();
    }
    
}
