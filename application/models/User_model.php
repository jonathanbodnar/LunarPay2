<?php

defined('BASEPATH') OR exit('No direct script access allowed');

function users_getTeamMemberPermissionsRate($permissions_str, $system_letter_id) {
  
    $total_eps = 0;
    $total_per = 0;
    if (strlen($permissions_str)) {
        $total_per = count(explode(',', $permissions_str));
        if ($system_letter_id == 'L') {
            $total_eps = count(MODULE_TREE);
        }
        if ($system_letter_id == 'H') {
            $total_eps = count(MODULE_TREE_COACH);
        }
    }
    return "$total_per / $total_eps";
}

class User_model extends CI_Model {

    private $table = 'users';

    public $valAsArray   = false;
    
    CONST STARTER_STEP_BANK_CONFIRMATION = 6;

    public function __construct() {
        parent::__construct();
    }

    private function beforeSave($data){
        if(isset($data['zelle_account_id'])){
            $data['zelle_account_id'] = strtolower(trimLR_Duplicates($data['zelle_account_id']));
        }
        return $data;
    }

    public function getDt() {
        $this->load->library("Datatables");
        $this->datatables->select("id, username, email, first_name, last_name, FROM_UNIXTIME(created_on) as created_on")
                ->from($this->table);
        $data = $this->datatables->generate();
        return $data;
    }

    public function getTeamDt() {
        $this->load->model('setting_model');
        $system_letter_id = $this->setting_model->getItem('SYSTEM_LETTER_ID');

        $this->load->library("Datatables");
        $this->datatables->select("id, username, email, CONCAT_WS(' ', first_name, last_name) as name, date(FROM_UNIXTIME(created_on)) as created_on, permissions")
                ->where('parent_id', $this->session->userdata('user_id'))
                ->from($this->table);
        if ($system_letter_id == 'L') {
            $this->datatables->add_column('permissions_rate', '$1', 'users_getTeamMemberPermissionsRate(permissions,L)');
        }

        if ($system_letter_id == 'H') {
            $this->datatables->add_column('permissions_rate', '$1', 'users_getTeamMemberPermissionsRate(permissions,H)');
        }
        $data = $this->datatables->generate();
        return $data;
    }

    public function get($id, $select = false) {
        if ($select) {
            $this->db->select($select);
        }
        $row = $this->db->where('id', $id)->from($this->table)->get()->row();
        return $row;
    }

    public function getByEmail($email, $select = false) {
        if ($select) {
            $this->db->select($select);
        }
        $row = $this->db->where('email', $email)->from($this->table)->get()->row();
        return $row;
    }

    public function update($data, $user_id, $generate_referral = false ) {
        $val_messages    = [];
        if($generate_referral){
            if(!$data['zelle_social_security']) {
                $val_messages [] = langx('The social security field is required');
            }
            if(!$data['zelle_account_id']) {
                $val_messages [] = langx('The email field is required');
            }
            if(!filter_var($data['zelle_account_id'], FILTER_VALIDATE_EMAIL)) {
                $val_messages [] = langx('A valid email is required');
            }

            if (!empty($val_messages)) {
                return [
                    'status'  => false,
                    'message' => langx('Validation error found'),
                    'errors' => !$this->valAsArray ? stringifyFormatErrors($val_messages) : $val_messages
                ];
            }
            $data['referral_code'] = substr(bin2hex(random_bytes(ceil(20 / 2))), 0, 20);
            $data = $this->beforeSave($data);
            $this->session->set_userdata(array('is_affiliate'=>1));
        }
        $this->db->where('id', $user_id);
        $this->db->update($this->table, $data);
        return [
            'status'  => true,
            'message' => langx(!$generate_referral ? 'User updated' : 'Account updated')
        ];
    }

    public function getTeamMember($id, $main_user_id) {
        $data = $this->db->select('id, first_name, last_name, email, phone, parent_id, permissions, date(FROM_UNIXTIME(created_on)) as created_on')
                        ->where('parent_id', $main_user_id) //==== security field
                        ->where('id', $id)
                        ->get($this->table)->row();

        $data->permissions = strlen($data->permissions) ? explode(',', $data->permissions) : [];

        return $data;
    }

    CONST MAX_STARTER_STEP = 8;
    public function setStarterStep($user_id, $step) {
        if($step > 0 && $step <= self::MAX_STARTER_STEP) {
            return $this->db->where('id', $user_id)->update($this->table, ['starter_step' => $step]);
        }
        throw new Exception('Step not available');
    }

    public function getStarterStep($user_id) {
        return $this->db->from($this->table)->where('id', $user_id)->select('starter_step')->get()->row();
    }

    public function getForceLogout($user_id) {
        $user = $this->db->select('force_logout')->where('id', $user_id)->get('users')->row();
        return $user ? $user->force_logout : null;
    }

    public function setForceLogout($user_id, $value_1_OR_null) {
        $this->db->where('id', $user_id)->update('users', ['force_logout' => $value_1_OR_null]);
    }
    
    public function getAllTeamMembersIds($parent_id) {
        $data = $this->db->from($this->table)->where('parent_id', $parent_id)->select('id')->get()->result();
        
        $result = [];
        foreach ($data as $row) {
            $result [] =  $row->id;
        }
        
        return $result;
    }

    public function accounts_GetAffiliatePayments() {
        $CI     = & get_instance();
        $CI->db->select('sum(amount) paid')
            ->where('p.user_id', $this->session->userdata('user_id'));
        
        $result = $CI->db->get('payment_affiliates p')->row();
        
        return round($result->paid, 2);    
    }
    
    public function accounts_GetAffiliateEarnings() {
        
       
        $CI     = & get_instance();
        
        // --- let's leave this here for debugging: 
        // --- $result = $CI->db->select('r.*, ch.church_name, t.total_amount')    
        
        $result = $CI->db->select('sum(t.total_amount) total_amount, count(t.id) trxn_count')
                ->where('r.user_id IS NOT NULL', null, false) // --- refferals registered on the system
                ->where('r.parent_id', $this->session->userdata('user_id')) // --- reach affiliate's refferals
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

}
