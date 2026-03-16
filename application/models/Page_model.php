<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Page_model extends CI_Model {

    private $table = 'pages';

    public function __construct() {
        parent::__construct();
    }

    public function getDt() {
        $this->load->library("Datatables");
        $this->datatables->select("p.id, CONCAT_WS(' / ', ch.church_name, c.name) as organization, p.page_name,
            p.title,p.content,p.type_page,
             DATE_FORMAT(p.created_at,'%m/%d/%Y') created_at_formatted, p.created_at, p.slug")
            ->join('church_detail ch','ch.ch_id = p.church_id','left')
            ->join('campuses c','c.id = p.campus_id','left')
            ->from($this->table .' as p')
            ->where('p.trash',0)
            ->where('p.client_id',$this->session->userdata('user_id'));

        $this->datatables->edit_column('type_page', '$1', 'ucfirst(type_page)');
        $data = $this->datatables->generate();
        return $data;
    }


    public function get($id, $user_id = null) {

        $this->db->where('id', $id)
            ->where('trash',0)
            ->from($this->table);
        if($user_id){
            $this->db->where('client_id', $user_id);
        }
        return $this->db->get()->row();
    }

    public function getList($user_id,$church_id,$campus_id,$include_trash = false) {

        $this->db->where('church_id',$church_id)
            ->where('client_id',$user_id);

        if(!$include_trash) {
            $this->db->where('trash', 0);
        }

        if($campus_id){
            $this->db->where('campus_id', $campus_id);
        } else {
            $this->db->where('campus_id is null');
        }

        $this->db->from($this->table);
        return $this->db->get()->result();
    }

    public function getBySlug($slug) {
        $row = $this->db->where('slug', $slug)
            ->where('trash',0)
            ->from($this->table)
            ->get()->row();
        return $row;
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

    public function remove($id, $user_id) {
        //it does not remove, it only hides
        $page = $this->get($id,$user_id);

        if (!$page) {
            return ['status' => false, 'message' => ''];
        }

        $this->db->where('client_id', $user_id)
            ->where('id', $id)
            ->update($this->table, ['trash' => 1,'slug' => $id.date('Ymd')]);

        return ['status' => true, 'message' => 'Page removed'];
    }

    public function removeAutomaticallyFromConduitFund($user_id,$church_id,$campus_id,$fund_id)
    {
        $pages = $this->getList($user_id,$church_id,$campus_id,true);
        foreach ($pages as $page){
            $page_conduit_funds = json_decode($page->conduit_funds);
            //Checking fund id on conduit funds and getting key to unset it
            if($page_conduit_funds && ($key = array_search($fund_id, $page_conduit_funds)) !== false) {
                unset($page_conduit_funds[$key]);
                $this->save(['id'=>$page->id,'conduit_funds' => json_encode(array_values($page_conduit_funds))]);
            }
        }
        return;
    }
}
