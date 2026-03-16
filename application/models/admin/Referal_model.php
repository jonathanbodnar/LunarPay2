<?php

defined('BASEPATH') OR exit('No direct script access allowed');
function paCreateLink($ref){
    return Referal_model::CODE_LINK_URL.$ref;
}
class Referal_model extends CI_Model { //include suborgnx too

    
    private $table     = 'referals';
   

    public function __construct() {
        parent::__construct();
    }

    public function getReferralsByUserId($id) {
        return $this->db->select("parent_id,full_name, email, DATE_FORMAT(date_sent, '%m/%d/%Y') date_sent, DATE_FORMAT(date_register, '%m/%d/%Y') date_register")
            ->where('parent_id',$id)
            ->order_by('id DESC')
            ->from($this->table)
            ->get()
            ->result_array();
    }
    
    
}
