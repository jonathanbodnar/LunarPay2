<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Orgnx_onboard_psf_model extends CI_Model {

    private $table = 'church_onboard_paysafe';

    public function __construct() {
        parent::__construct();
    }

    public function getById($id, $select = false) {

        if ($select) {
            $this->db->select($select);
        } else {
            $this->db->select('*');
        }

        $this->db->where('id', $id);
        $row = $this->db->get($this->table)->row();

        return $row;
    }

}
