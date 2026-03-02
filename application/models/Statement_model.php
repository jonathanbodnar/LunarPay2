<?php

defined('BASEPATH') OR exit('No direct script access allowed');

function stCreateFileUrl($created_by, $file_name) {
    return BASE_URL . 'files/get/' . ($created_by == 'A' ? 'statmnts_admin/' : 'statmnts_donor/') . $file_name;
}

class statement_model extends CI_Model {

    private $table = 'statements';

    public function __construct() {
        parent::__construct();
    }

    public function getDt() {

        $user_id  = $this->session->userdata('user_id');
        $orgnx_id = $this->input->post('organization_id');

        $this->load->library("Datatables");

        if ($orgnx_id) {
            $this->datatables->where('sta.church_id', $orgnx_id);
        }
        $this->datatables->select('sta.id, sta.type, sd.donor_name, c.church_name, count(sd.id) as donors, '
                        . 'DATE_FORMAT(sta.date_from, "%m/%d/%Y") as date_from, DATE_FORMAT(sta.date_to, "%m/%d/%Y") as date_to, '
                        . 'DATE_FORMAT(sta.created_at, "%m/%d/%Y") as created_at, sta.file_name, '
                        . 'IF(sta.created_by = "D", "Donor", "Dashboard Admin") as created_by, created_by as created_by_')
                ->join('church_detail c', 'c.ch_id = sta.church_id', 'LEFT')
                ->join('statement_donors sd', 'sd.statement_id = sta.id', 'INNER')
                ->where('sta.client_id', $user_id)
                ->group_by('sta.id')
                ->from($this->table . ' sta');

        $this->datatables->add_column('file_url', '$1', 'stCreateFileUrl(created_by_, file_name)');

        $data = $this->datatables->generate();
        return $data;
    }

    public function register($data) {
        $this->db->insert($this->table, $data);
        return $this->db->insert_id();
    }

    public function update($data) {
        $id = $data['id'];
        unset($data['id']);
        return $this->db->where('id', $id)->update($this->table, $data);
    }

    public function get($id, $user_id) {
        $this->db->select('s.*, d.first_name donor_f_name, d.last_name donor_l_name');

        $this->db->where('s.client_id', $user_id)->where('s.id', $id);
        $this->db->join('account_donor d', 'd.id = s.account_donor_id', 'LEFT');
        $data = $this->db->get($this->table . ' s')->row();

        if ($data) {
            $this->load->model('organization_model');

            $data->file_url = stCreateFileUrl($data->created_by, $data->file_name);

            $data->orgnx      = $this->organization_model->get($data->church_id, false, true); //include trash
            $data->date_from  = date('m/d/Y', strtotime($data->date_from));
            $data->date_to    = date('m/d/Y', strtotime($data->date_to));
            $data->created_at = date('m/d/Y H:i:s', strtotime($data->created_at));
            $data->donors     = $this->db->where('statement_id', $data->id)->get('statement_donors')->result();
        }

        return $data;
    }

}
