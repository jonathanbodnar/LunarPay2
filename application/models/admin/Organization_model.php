<?php

defined('BASEPATH') OR exit('No direct script access allowed');

function fuCountFunds($organization_id) {
    $CI     = & get_instance();
    $result = $CI->db->select('count(f.id) count_donations')
                    ->where('f.church_id', $organization_id)
                    ->where('f.campus_id is null')
                    ->get('funds f')->row();

    return $result->count_donations ? $result->count_donations : 0;
}

class Organization_model extends CI_Model {

    private $table = 'church_detail';

    public function __construct() {
        parent::__construct();
    }

    private function checkBelongsToUser($id, $user_id) {
        return checkBelongsToUser([
            ['church_detail.ch_id' => $id, 'client_id', 'users.id', $user_id]
        ]);
    }

    public function getDt() {
        $user_id = $this->session->userdata('user_id');
        $this->load->library("Datatables");
        $this->datatables->select("ch_id, church_name, phone_no, website, street_address, city, state, postal, tax_id, giving_type, epicpay_template, epicpay_verification_status, twilio_phoneno")
                ->where('client_id', $user_id)
                ->where('trash', 0)
                ->from($this->table);
        $this->datatables->add_column('count_funds', '$1', 'fuCountFunds(ch_id)');
        $data    = $this->datatables->generate();
        return $data;
    }

    public function getList($select = false, $orderBy = false) {
        $user_id = $this->session->userdata('user_id');

        if ($select) {
            $this->db->select($select);
        } else {
            $this->db->select("ch_id, church_name");
        }

        if ($orderBy) {
            $this->db->order_by($orderBy);
        }

        $result = $this->db->from($this->table)
                        ->where('client_id', $user_id)
                        ->where('trash', 0)
                        ->get()->result_array();
        return $result;
    }

    public function getWhere($select = false, $where = false, $include_trash = false, $orderBy = false) {

        if ($select) {
            $this->db->select($select);
        } else {
            $this->db->select('ch_id, client_id, website, logo, church_name, phone_no, website, street_address, street_address_suite, '
                    . 'legal_name, email, city, state, postal, tax_id, giving_type, epicpay_template, epicpay_verification_status');
        }

        if ($where) {
            $this->db->where($where);
        }

        if (!$include_trash) {
            $this->db->where('trash', 0);
        }

        if ($orderBy) {
            $this->db->order_by($orderBy);
        }

        $result = $this->db->get($this->table)->result();
        return $result;
    }

    //===== get the first orgnx created
    public function getMain($select, $user_id) {

        if ($select) {
            $this->db->select($select);
        } else {
            $this->db->select('ch_id, client_id, website, logo, church_name, phone_no, website, street_address, street_address_suite, '
                    . 'legal_name, email, city, state, postal, tax_id, giving_type, epicpay_template, epicpay_verification_status');
        }

        $this->db->where('client_id', $user_id);
        $this->db->where('trash', 0);

        $this->db->order_by('ch_id asc');
        $this->db->limit(1);

        $result = $this->db->get($this->table)->row();
        return $result;
    }

    public function get($id, $select = false, $include_trash = false, $user_id = false) {
        if ($select) {
            $this->db->select($select);
        } else {
            $this->db->select('ch_id, client_id, website, logo, church_name, phone_no, website, street_address, street_address_suite, '
                    . 'legal_name, email, city, state, postal, tax_id, giving_type, epicpay_template, epicpay_verification_status');
        }

        if (!$include_trash) {
            $this->db->where('trash', 0);
        }

        if ($user_id) { //===== secure calls
            $this->db->where('client_id', $user_id);
        }

        $row = $this->db->where('ch_id', $id)->from($this->table)->get()->row();
        return $row;
    }

    public function getByToken($token) {
        $this->db->select('ch_id, church_name,client_id');
        $row = $this->db->where('token', $token)->where('trash', 0)->from($this->table)->get()->row();
        return $row;
    }

    public function getBySlug($slug) {
        $this->db->select('ch_id, church_name,token');
        $row = $this->db->where('slug', $slug)->where('trash', 0)->from($this->table)->get()->row();
        return $row;
    }

    private function beforeSave($data) {
        if (isset($data['church_name']))
            $data['church_name']          = trim(ucfirst($data['church_name']));
        if (isset($data['legal_name']))
            $data['legal_name']           = trim(ucfirst($data['legal_name']));
        if (isset($data['street_address']))
            $data['street_address']       = trim(ucfirst($data['street_address']));
        if (isset($data['street_address_suite']))
            $data['street_address_suite'] = trim(ucfirst($data['street_address_suite']));
        if (isset($data['city']))
            $data['city']                 = trim(ucfirst($data['city']));
        if (isset($data['state']))
            $data['state']                = ucfirst($data['state']);
        if (isset($data['todo_notes']) && !$data['todo_notes'])
            $data['todo_notes']              = null;
        if (isset($data['todo_action_required_by']) && !$data['todo_action_required_by'])
            $data['todo_action_required_by'] = null;
        if (isset($data['todo_reference_date']) && (!$data['todo_reference_date'] || (bool) strtotime($data['todo_reference_date']) == false)) {
            $data['todo_reference_date'] = null;
        }

        return $data;
    }

    public function register($data) {
        unset($data['ch_id']);

        $user_id           = $this->session->userdata('user_id');
        $data['client_id'] = $user_id;

        //Setting Token
        $bytes                    = openssl_random_pseudo_bytes(16, $cstrong);
        $token                    = bin2hex($bytes);
        $data['token']            = $token;
        $data['epicpay_template'] = EPICPAY_TPL_DEFAULT;
        $data['created_at']       = date('Y-m-d H:i:s');

        $data = $this->beforeSave($data);

        $this->db->insert($this->table, $data);
        return $this->db->insert_id();
    }

    public function update($data) {
        $id      = $data['ch_id'];
        
        $data = $this->beforeSave($data);

        $this->db->where('ch_id', $id);
        $this->db->update($this->table, $data);
        return true;
    }

    public function setSlug($id, $slug) {
        $this->db->where('ch_id', $id);
        $this->db->update($this->table, ['slug' => $slug]);
        return true;
    }

    public function update_twilio($church_id, $twilio_data) {
        $user_id = $this->session->userdata('user_id');

        $this->db->where('ch_id', $church_id);
        $this->db->where('client_id', $user_id); //secure query

        $this->db->update($this->table, $twilio_data);
        return true;
    }

    public function remove($church_id) {
        //it does not remove, it only hides
        $orgnx = $this->get($church_id);
        if (!$orgnx) {
            return ['status' => false, 'message' => 'An error ocurred'];
        }

        $this->db->where('ch_id', $church_id)->update($this->table, ['trash' => 1]);
        return ['status' => true, 'message' => 'Organization removed'];
    }

}
