<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Orgnx_onboard_model extends CI_Model {

    private $table = 'church_onboard';

    public function __construct() {
        parent::__construct();
    }

    private function beforeSave($data) {

        if (isset($data['sign_first_name']))
            $data['sign_first_name']      = ucwords(strtolower(trim($data['sign_first_name'])));
        if (isset($data['sign_last_name']))
            $data['sign_last_name']       = ucwords(strtolower(trim($data['sign_last_name'])));
        if (isset($data['sign_title']))
            $data['sign_title']           = ucfirst(strtolower(trim($data['sign_title'])));
        if (isset($data['sign_city']))
            $data['sign_city']            = ucfirst(strtolower(trim($data['sign_city'])));
        if (isset($data['account_holder_name']))
            $data['account_holder_name']  = ucwords(strtolower(trim($data['account_holder_name'])));
        if (isset($data['routing_number_last4']))
            $data['routing_number_last4'] = substr(trim($data['routing_number_last4']), -4);
        if (isset($data['account_number_last4']))
            $data['account_number_last4'] = substr(trim($data['account_number_last4']), -4);
        if (isset($data['sign_address_line_1']))
            $data['sign_address_line_1']  = trim(ucfirst($data['sign_address_line_1']));
        if (isset($data['sign_address_line_2']))
            $data['sign_address_line_2']  = trim(ucfirst($data['sign_address_line_2']));
        if (isset($data['sign_date_of_birth']))
            $data['sign_date_of_birth']   = date('Y-m-d', strtotime($data['sign_date_of_birth']));

        return $data;
    }

    public function register($data) {
        $data['processor'] = 'EPICPAY';

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
        $row = $this->db->get($this->table)->row();

        return $row;
    }

}
