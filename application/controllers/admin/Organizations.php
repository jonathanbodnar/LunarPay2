<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Organizations extends My_Controller {

    public $data = [];

    public function __construct() {
        parent::__construct();

        if (!$this->ion_auth->logged_in() && $this->session->userdata('role') === 'admin') {
            redirect('auth/login', 'refresh');
        }
    }

    public function remove() {
        $this->load->model('admin/organization_model');

        if (!$this->input->post('ch_id')) {
            output_json([
                'status'  => false,
                'message' => 'No Organization found'
            ]);
            return;
        }

        $result = $this->organization_model->remove($this->input->post('ch_id'));
        
        output_json([
            'status'  => $result['status'],
            'message' => $result['message']
        ]);
    }
    
    public function get_todo() {
        
        $this->load->model('admin/organization_model');
        $ch_id = $this->input->post('ch_id');
        $org = $this->organization_model->get($ch_id, 'todo_notes, todo_action_required_by, todo_reference_date, church_name, ch_id', true);
        
        output_json([
            'status'  => true,
            'org' => $org
        ]);
    }
    
     public function save_todo() {
        $this->load->model('admin/organization_model');
        
        $result = $this->organization_model->update($this->input->post());
        
        if($result !== true) {
            output_json($result);
        } else {
            output_json(['status' => true, 'message' => 'success']);
        }
    }

}
