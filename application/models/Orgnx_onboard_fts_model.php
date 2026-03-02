<?php

defined('BASEPATH') or exit('No direct script access allowed');

class Orgnx_onboard_fts_model extends CI_Model
{

    private $table = 'church_onboard_fortis';
    public $load_secured_fields = false;
    public $secure_check = true;
    private $secured_fields = [
        'processor_response',
        'credentials'
    ];

    public function __construct()
    {
        parent::__construct();
    }

    private function beforeSave($data)
    {

        if (isset($data['sign_first_name']))
            $data['sign_first_name']  = ucwords(strtolower(trim($data['sign_first_name'])));

        if (isset($data['sign_last_name']))
            $data['sign_last_name']  = ucwords(strtolower(trim($data['sign_last_name'])));

        if (isset($data['merchant_address_line_1']))
            $data['merchant_address_line_1'] = ucfirst(preg_replace('/\s\s+/', ' ', $data['merchant_address_line_1']));

        if (isset($data['merchant_city']))
            $data['merchant_city'] = ucfirst(preg_replace('/\s\s+/', ' ', $data['merchant_city']));

        if (isset($data['account_number_last4']))
            $data['account_number_last4'] = substr(trim($data['account_number_last4']), -4);

        if (isset($data['routing_number_last4']))
            $data['routing_number_last4'] = substr(trim($data['routing_number_last4']), -4);

        if (isset($data['account_holder_name']))
            $data['account_holder_name']  = ucwords(strtolower(trim($data['account_holder_name'])));

        if (isset($data['account2_number_last4']))
            $data['account2_number_last4'] = substr(trim($data['account2_number_last4']), -4);

        if (isset($data['routing2_number_last4']))
            $data['routing2_number_last4'] = substr(trim($data['routing2_number_last4']), -4);


        if (isset($data['account2_holder_name']))
            $data['account2_holder_name']  = ucwords(strtolower(trim($data['account2_holder_name'])));

        return $data;
    }

    public function register($data)
    {

        $data = $this->beforeSave($data);

        $this->db->insert($this->table, $data);
        return $this->db->insert_id();
    }

    public function update($data, $user_id = null)
    {

        if ($this->secure_check) { //safe check, when not sent we asume we asume it is a safe
            if (!$user_id) {
                throw new Exception('Invalid request, user_id is required for securing data, otherwise set secure_check to false');
            }
            if (!isset($data['church_id'])) {
                throw new Exception('church_id is required for securing data');
            }

            $result = checkBelongsToUser([['church_detail.ch_id' => $data['church_id'], 'client_id', 'users.id', $user_id]]);
            if ($result !== true) {
                return $result;
            }
        }

        $data = $this->beforeSave($data);

        $this->db->where('id', $data['id']);
        //->where('church_id', $data['church_id']);
        $this->db->update($this->table, $data);
        return true;
    }

    public function getByOrg($church_id, $user_id = null, $select = false)
    {
        if ($this->secure_check) { //safe check, when not sent we asume we asume it is a safe
            if (!$user_id) {
                throw new Exception('Invalid request, user_id is required for securing data, otherwise set secure_check to false');
            }
            $result = checkBelongsToUser([['church_detail.ch_id' => $church_id, 'client_id', 'users.id', $user_id]]);
            if ($result !== true) {
                throw new Exception('Invalid request');
            }
        }


        if ($select) {
            $this->db->select($select);
        } else {
            $this->db->select('*');
        }

        $this->db->where('church_id', $church_id);
        $orgnx = $this->db->get($this->table)->row();

        if (!$this->load_secured_fields) {
            foreach ($this->secured_fields as $field) {
                unset($orgnx->$field);
            }
        }

        if ($orgnx && property_exists($orgnx, 'merchant_state')) {
            $this->load->model('localization_model');
            $states = $this->localization_model->getUsStates();
            if (isset($states[$orgnx->merchant_state])) {
                $orgnx->_merchant_state = $states[$orgnx->merchant_state];
            } else {                
                $orgnx->_merchant_state = $orgnx->merchant_state; // Or some default value
            }
        }

        return $orgnx;
    }

    public function getById($id, $user_id, $select = false)
    {

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

    public function checkOrganizationIsCompleted($user_id, $withChatIsInstalled = true)
    {
        $orgnx = $this->db->select('o.id, c.ch_id')
            ->join($this->table . ' o', 'o.church_id = c.ch_id', 'inner')
            ->where('c.client_id', $user_id)
            ->where('trash', 0)
            ->where('app_status like "ACTIVE"')
            ->order_by('c.ch_id', 'ASC')
            ->get('church_detail c')
            ->row();

        if ($orgnx) {
            if ($withChatIsInstalled) {
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
}
