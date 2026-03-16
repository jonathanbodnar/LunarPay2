<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Orgnx_onboard_crypto_model extends CI_Model {

    private $table = 'church_onboard_crypto';
    public $load_secured_fields = false;
    private $secured_fields = [
        'merchant_requests'        
    ];

    //@ active => null = not defined, 0, do not create it, 1 = create it
    
    public function __construct() {
        parent::__construct();
    }

    private function beforeSave($data) {

        if (isset($data['merchant_name']))
            $data['merchant_name'] = ucwords(strtolower(trim($data['merchant_name'])));

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

}
