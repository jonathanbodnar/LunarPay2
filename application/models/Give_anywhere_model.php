<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Give_anywhere_model extends CI_Model {

    private $table = 'give_anywhere';

    public function __construct() {
        parent::__construct();
    }

    public function getDt() {
        $this->load->library("Datatables");
        $this->datatables->select("g.id, CONCAT_WS(' / ', ch.church_name, c.name) as organization, g.button_text, "
                . "DATE_FORMAT(g.created_at,'%m/%d/%Y') created_at_formatted, g.created_at")
            ->join('church_detail ch','ch.ch_id = g.church_id','left')
            ->join('campuses c','c.id = g.campus_id','left')
            ->from($this->table .' as g')
            ->where('g.client_id',$this->session->userdata('user_id'));

        $data = $this->datatables->generate();
        return $data;
    }


    public function get($id, $user_id) {
        $this->db->where('id', $id)->where('client_id', $user_id)->from($this->table);
        return $this->db->get()->row();
    }

    public function save($data) {
        $id = $data['id'];
        if(!$id){
            unset($data['id']);
            $data['created_at'] = date("Y-m-d h:i:sa");
            $this->db->insert($this->table,$data);
            return $this->db->insert_id();
        } else {
            unset($data['client_id']);
            $user_id = $this->session->userdata('user_id');

            $this->db->where('client_id',$user_id);
            $this->db->where('id',$id);
            $this->db->update($this->table,$data);
            return $id;
        }
    }
}
