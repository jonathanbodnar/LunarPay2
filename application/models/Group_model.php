<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Group_model extends CI_Model {

    private $table = 'groups';

    public function __construct() {
        parent::__construct();
    }

    public function getDt() {
        $this->load->library("Datatables");
        $this->datatables->select('id, name, description')
                ->from($this->table);
        $data = $this->datatables->generate();
        return $data;
    }

}
