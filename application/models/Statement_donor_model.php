<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class statement_donor_model extends CI_Model {

    private $table = 'statement_donors';

    public function __construct() {
        parent::__construct();
    }

    public function register($data) {
        $this->db->insert($this->table, $data);
        return $this->db->insert_id();
    }

}
