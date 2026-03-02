<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Orgnx_onboard_psf_model extends CI_Model {

    private $table = 'church_onboard_paysafe';
    public $load_secured_fields = false;
    private $secured_fields = [
        'merchant_requests', 
        'merchant_responses', 
        'backoffice_recovery_question', 
        'backoffice_username',
        'account_number_last4',
        'activation_request_response',
        'activation_request_response2',
        'backoffice_email',
        'backoffice_hash',
        'terms_conditions_1',
        'terms_conditions_2',
        'terms_conditions_meta',
        'terms_conditions_meta2'
    ];

    public function __construct() {
        parent::__construct();
    }

    private function beforeSave($data) {

        if (isset($data['merchant_name']))
            $data['merchant_name'] = ucwords(strtolower(trim($data['merchant_name'])));

        if (isset($data['dynamic_descriptor']))
            $data['dynamic_descriptor'] = strtoupper(preg_replace('/\s\s+/', ' ', $data['dynamic_descriptor']));

        if (isset($data['trading_address_line_1']))
            $data['trading_address_line_1'] = ucfirst(preg_replace('/\s\s+/', ' ', $data['trading_address_line_1']));

        if (isset($data['trading_address_line_2']))
            $data['trading_address_line_2'] = ucfirst(preg_replace('/\s\s+/', ' ', $data['trading_address_line_2']));

        if (isset($data['account_holder_name']))
            $data['account_holder_name']  = ucwords(strtolower(trim($data['account_holder_name'])));
        if (isset($data['routing_number_last4']))
            $data['routing_number_last4'] = substr(trim($data['routing_number_last4']), -4);
        if (isset($data['account_number_last4']))
            $data['account_number_last4'] = substr(trim($data['account_number_last4']), -4);
        
        if(isset($data['owner_ssn'])) { 
            $data['owner_ssn'] = str_replace('-', '', $data['owner_ssn']); //remove dashes
        }
        

        return $data;
    }

    public function register($data) {

        $data = $this->beforeSave($data);

        $this->db->insert($this->table, $data);
        return $this->db->insert_id();
    }

    public function update($data, $user_id) {

        if (!isset($data['church_id'])) {
            throw new Exception('church_id is required for securing data');
        }

        $result = checkBelongsToUser([['church_detail.ch_id' => $data['church_id'], 'client_id', 'users.id', $user_id]]);
        if ($result !== true) {
            return $result;
        }

        $data = $this->beforeSave($data);

        $this->db->where('id', $data['id'])->where('church_id', $data['church_id']);
        $this->db->update($this->table, $data);
        return true;
    }

    public function getByOrg($church_id, $user_id, $select = false) {

        $result = checkBelongsToUser([['church_detail.ch_id' => $church_id, 'client_id', 'users.id', $user_id]]);
        if ($result !== true) {
            throw new Exception('Invalid request');
        }

        if ($select) {
            $this->db->select($select);
        } else {            
            $this->db->select('*');
        }

        $this->db->where('church_id', $church_id);
        $orgxn_psf = $this->db->get($this->table)->row();

        if(!$this->load_secured_fields){
            foreach($this->secured_fields as $field) {
                unset($orgxn_psf->$field);
            }
        }
        
        return $orgxn_psf;
    }

    //we will look for the the first backoffice user created, it's on the first psf organization created
    //that username will be used for all merchant accounts and for all churches
    public function getBackofficeUser($user_id) {
        $onboard = $this->db->where('c.client_id', $user_id)
                ->where('trash', 0)
                ->where('backoffice_username is NOT NULL', NULL, FALSE)
                ->join($this->table . ' o', 'o.church_id = c.ch_id', 'inner')
                ->select('backoffice_username, backoffice_email, backoffice_hash')
                ->order_by('c.ch_id', 'desc')
                ->get('church_detail c')
                ->row();

        $this->load->library('encryption');
        $encryptPhrase = $this->config->item('pty_epicpay_encrypt_phrase');
        $this->encryption->initialize(['cipher' => 'aes-256', 'mode' => 'ctr', 'key' => $encryptPhrase]);

        if ($onboard) {
            $onboard->password = $this->encryption->decrypt($onboard->backoffice_hash);
        }

        return $onboard;
    }

    public function getById($id, $user_id, $select = false) {

        $result = checkBelongsToUser([
            ['church_onboard_paysafe.id' => $id, 'church_id', 'church_detail.ch_id'],
            ['church_detail.ch_id' => '?', 'client_id', 'users.id', $user_id],
        ]);

        if ($result !== true) {
            throw new Exception('Invalid request');
        }

        if ($select) {
            $this->db->select($select);
        } else {
            $this->db->select('*');
        }

        $this->db->where('id', $id);
        $row = $this->db->get($this->table)->row();

        return $row;
    }

    public function checkOrganizationPSFIsCompleted($user_id, $withChatIsInstalled = true)
    {
        //An organization is Paysafe completed if statuses are enabled and the widget has been installed
        
        $orgnx = $this->db->select('o.account_id, c.ch_id')
            ->join($this->table . ' o', 'o.church_id = c.ch_id', 'inner')            
            ->where('c.client_id', $user_id)
            ->where('trash', 0)
            ->where('o.account_status like "enabled" AND o.account_status2 like "enabled"')
            ->order_by('c.ch_id', 'ASC')
            ->get('church_detail c')
            ->row();
        
        if($orgnx) {
            if($withChatIsInstalled) {
                $this->load->model('chat_setting_model');
                $chat_settings = $this->chat_setting_model->getChatSetting($user_id, $orgnx->ch_id, null);

                if ($chat_settings && $chat_settings->install_status == 'C') {
                    return TRUE;
                }
            } else {
                return TRUE;
            }            
        }
        
        return FALSE;
    }

    public function getZappierPollingData()
    {
        return  $this->db->select('c.ch_id as id,c.ch_id as update_ctrl, u.email as email, '
                . 'CONCAT_WS(" ", u.first_name, u.last_name) as names, u.company as organization, '.
                    'IF(o.account_status is not null OR o.account_status2 is not null,'. // Checking is in progress
                    'IF(o.account_status like "enabled" AND o.account_status2 like "enabled",'. // Checking is Verified
                        'IF(st.install_status like "C",'. // Checking is Installed
                            'IF(COUNT(ect.id) > 0,'. // Checking is Collecting
                                '"collecting",'. // Colling status with all conditions okay
                            '"installed"),'. // Installed if is not collecting
                        '"verified"),'. // Verified if is not installed
                        '"in_progress"),'. // In Progress
                    '"registered") as status, '// Registered when isn't verified
                . 'DATE_FORMAT(FROM_UNIXTIME(u.created_on), "%Y-%m-%d") as user_created_on '
            )
            ->join($this->table . ' o', 'o.church_id = c.ch_id', 'left')
            ->join('users u', 'u.id = c.client_id', 'inner')
            ->join('chat_settings st', 'st.church_id = c.ch_id and st.campus_id is null' ,'left')
            ->join('epicpay_customer_transactions ect','ect.church_id = c.ch_id AND ect.trx_type = "DO"','left')
            ->group_by('c.ch_id')
            ->where('trash', 0)
            ->order_by('c.ch_id', 'DESC')
            ->get('church_detail c')
            ->result_array();
    }
    
    //seeking account1 2 & 3 only "credit card", "ACH", "EFT"
    public function getByAccount($account_number) {
        $account_id = $this->db->select('id, account_id, account_id2, account_id3, account_id4, account_id5, account_id6')
                        ->where('account_id', $account_number)->get($this->table)->row();

        if ($account_id) {
            return ['status' => true, 'account' => $account_id, 'type' => 'credit_card'];
        }

        $account_id2 = $this->db->select('id, account_id, account_id2, account_id3, account_id4, account_id5, account_id6')
                        ->where('account_id2', $account_number)->get($this->table)->row();

        if ($account_id2) {
            return ['status' => true, 'account' => $account_id2, 'type' => 'ach'];
        }

        $account_id3 = $this->db->select('id, account_id, account_id2, account_id3, account_id4, account_id5, account_id6')
                        ->where('account_id3', $account_number)->get($this->table)->row();

        if ($account_id3) {
            return ['status' => true, 'account' => $account_id3, 'type' => 'eft'];
        }

        return ['status' => false, 'account' => null];
    }

}
