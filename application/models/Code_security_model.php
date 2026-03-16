<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Code_security_model extends CI_Model {

    private $table = 'code_security';

    public function __construct() {
        parent::__construct();
    }

    public function create($identity, $code) {
        $this->db->where('user_identity',$identity)->delete($this->table);
        $this->db->insert($this->table, ['user_identity'=>$identity,'code' => $code]);
        return $this->db->insert_id();
    }

    public function get($identity,$code) {
        return $this->db->from($this->table)->where('user_identity',$identity)->where('code',$code)->get()->row();
    }
    
    //once the user has grants we need to code, we can do that by removing the record
    //verifyx - we need an expiration for our security code, we can use a cron job, we should not let the user to create a code and he just to leave the login
    public function reset($identity) {
        $this->db->where('user_identity', $identity)->delete($this->table);
    }

}
