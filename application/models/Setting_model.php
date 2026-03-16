<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Setting_model extends CI_Model {

    private $table = 'settings';

    public function __construct() {
        parent::__construct();
    }

    public function getItem($type) {

        $item = $this->db->where('type', $type)
            ->from('settings')
            ->get()
            ->row()->description;

        return $item;
    }

}
