<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class User_model extends CI_Model {

    private $table = 'users';

    public function __construct() {
        parent::__construct();
    }

    public function getDt() {
        $this->load->library("Datatables");
        $this->datatables->select("id, username, email, first_name, last_name, FROM_UNIXTIME(created_on) as created_on")
                ->where('role', 'admin')
                ->from($this->table);
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

    public function update($data, $user_id) {

        $this->db->where('id', $user_id);
        $this->db->update($this->table, $data);
        return true;
    }

}
