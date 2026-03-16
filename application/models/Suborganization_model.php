<?php

defined('BASEPATH') OR exit('No direct script access allowed');

function fuSubCountFunds($organization_id,$suborganization_id) {
    $CI     = & get_instance();
    $result = $CI->db->select('count(f.id) count_donations')
        ->where('f.church_id', $organization_id)
        ->where('f.campus_id', $suborganization_id)
        ->get('funds f')->row();

    return $result->count_donations ? $result->count_donations : 0;
}

class Suborganization_model extends CI_Model {

    private $table = 'campuses';

    public function __construct() {
        parent::__construct();
    }

    private function checkBelongsToUser($id, $user_id) {
        return checkBelongsToUser([
            ['campuses.id' => $id, 'church_id', 'church_detail.ch_id'],
            ['church_detail.ch_id' => '?', 'client_id', 'users.id', $user_id],
        ]);
    }

    public function getDt() {
        //Getting Organization Ids
        $organizations_ids = getOrganizationsIds($this->session->userdata('user_id'));

        $this->load->library("Datatables");
        $this->datatables->select("id,church_id,name,phone,address,pastor,description")
                ->from($this->table);

        $this->datatables->where('church_id  in ('.$organizations_ids.')');

        $church_id = (int) $this->input->post('organization_id');
        if ($church_id)
            $this->datatables->where('church_id', $church_id);

        $this->datatables->add_column('count_funds', '$1', 'fuSubCountFunds(church_id,id)');
        $data = $this->datatables->generate();
        return $data;
    }

    public function getList() {
        //Getting Organization Ids
        $organizations_ids = getOrganizationsIds($this->session->userdata('user_id'));

        $result = $this->db->from($this->table);

        //Organizations of User Filter
        $this->db->where('church_id  in ('.$organizations_ids.')');

        $church_id = (int) $this->input->post('organization_id');
        
        $this->db->where('church_id', $church_id);

        $result = $this->db->get()->result_array();
        return $result;
    }

    public function register($data) {

        unset($data['id']);

        //Setting Token
        $bytes = openssl_random_pseudo_bytes(16, $cstrong);
        $token = bin2hex($bytes);
        $data['token'] = $token;

        $data['name'] = ucfirst($data['name']);
        $data['address'] = ucfirst($data['address']);
        $data['pastor'] = ucfirst($data['pastor']);
        $data['description'] = ucfirst($data['description']);
        
        
        $this->db->insert($this->table, $data);
        
        $campus_id = $this->db->insert_id();
        
        $this->load->model('fund_model');
        
        $fund_data = ['church_id' => $data['church_id'], 'campus_id' => $campus_id, 'name' => 'General'];

        $this->fund_model->register($fund_data);
        
        return $campus_id;
    }

    public function update($data) {
        $campus_id = $data['id'];

        $user_id = $this->session->userdata('user_id');
        $result  = $this->checkBelongsToUser($campus_id, $user_id);

        if ($result !== true) {
            return $result;
        }
        
        $data['name'] = ucfirst($data['name']);
        $data['address'] = ucfirst($data['address']);
        $data['pastor'] = ucfirst($data['pastor']);
        $data['description'] = ucfirst($data['description']);

        $this->db->where('id', $campus_id);
        $this->db->update($this->table, $data);
        return true;
    }

    public function setSlug($id,$slug) {
        $this->db->where('id', $id);
        $this->db->update($this->table, ['slug' => $slug]);
        return true;
    }

    public function get($id, $user_id = false, $select = false) {
        
        if ($select) {
            $this->db->select($select);
        } else {
            $this->db->select('*');
        }
        
        $this->db->where('id', $id)->from($this->table);

        if ($user_id) { //===== secure calls
            $this->db->join('church_detail c','c.ch_id = church_id')
                ->where('c.trash', 0)
                ->where('c.client_id', $user_id);
        }

        return $this->db->get()->row();
    }

    public function getByToken($token) {

        $row = $this->db->where('token', $token)->from($this->table)->get()->row();
        return $row;
    }

    public function getBySlug($slug) {
        $row = $this->db->where('slug', $slug)->from($this->table)->get()->row();
        return $row;
    }

    public function getSelect($id, $select) {
        return $this->db->select($select)->where('id', $id)->from($this->table)->get()->row();
    }

}
