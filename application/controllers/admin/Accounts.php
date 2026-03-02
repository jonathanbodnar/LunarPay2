<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Accounts extends My_Controller {///

    public $data = [];

    public function __construct() {
        parent::__construct();
        if (!$this->ion_auth->logged_in() || $this->session->userdata('role') !== 'admin') {
            redirect('auth/login', 'refresh');
        }

        $this->template_data['view_index'] = $this->router->fetch_class() . '/' . $this->router->fetch_method();
        $this->load->use_theme(THEME_LAYOUT_ADMIN);

        $this->load->library(['form_validation']);

        $this->lang->load(['auth']);
    }

    public function index() {
        
        $this->template_data['title'] = langx("Merchants");

        $this->template_data['identity_column'] = $this->config->item('identity', 'ion_auth');

        $this->load->model('admin/accounts_model');
        $this->template_data['statuses']['data'] = $this->accounts_model->getStatusesData();


        $titles = [];
        $values = [];

        foreach ($this->template_data['statuses']['data'] as $i => $data) {
            $titles[$i] = STATUSES[$i]['title'] . ' (' . $data . ')';
            $values[$i] = $data;
        }

        $this->template_data['statuses']['titles_with_values'] = $titles;
        $this->template_data['statuses']['titles'] = array_map(fn($s) => $s['title'], STATUSES);
        $this->template_data['statuses']['values'] = $values;

        $view                           = $this->load->view('accounts/accounts', ['view_data' => $this->template_data], true);
        $this->template_data['content'] = $view;

        $this->load->view('main', $this->template_data);
    }

    public function get_dt() {
        $this->load->model('admin/accounts_model');
        output_json($this->accounts_model->getDt(), true);
    }

    public function get_groups_dt() {
        $this->load->model('admin/group_model');
        output_json($this->group_model->getGroupsDt(), true);
    }

    public function get_groups_list() {
        $limit  = 30;
        $offset = ($this->input->post('page') ? $this->input->post('page') : 0) * $limit;

        $this->db->select('SQL_CALC_FOUND_ROWS id, name as text', false);
        $this->input->post('q') ? $this->db->like('name', $this->input->post('q')) : true;
        $data = $this->db->limit($limit, $offset)->get('groups')->result();

        $total_count = $this->db->query('SELECT FOUND_ROWS() cnt')->row();

        output_json([
            'items'       => $data,
            'total_count' => $total_count->cnt,
        ]);
    }

    public function get_user() {

        $id          = $this->input->post('id');
        $user        = $this->ion_auth->user($id)->row();
        $user_groups = $this->ion_auth->get_users_groups($id)->result();

        output_json([
            'user'        => $user,
            'user_groups' => $user_groups
        ]);
    }

    public function show_details($onboard_id = false) {
        if (!$onboard_id) {
            die('No data found');
        }
        $this->load->model('admin/orgnx_onboard_psf_model');

        $this->template_data['title'] = langx("Detail");

        $select = 'merchant_name, merchant_responses';

        $onboard_data = $this->orgnx_onboard_psf_model->getById($onboard_id, $select);

        $bank_validation_attempts = 0;
        if (isset($onboard_data->merchant_responses) && $onboard_data->merchant_responses) {
            $merchant_responses = json_decode($onboard_data->merchant_responses);


            foreach ($merchant_responses as $row) {
                
                if (isset($row->_operation) && $row->_operation) {
                    if (strpos($row->_operation, 'bank_amount_confirmation') !== false) {
                        if ((isset($row->response->status) && strtolower($row->response->status) == 'failed') || isset($row->response->error)) {
                            $bank_validation_attempts++;
                        }
                    }
                }
            }
            
            $this->template_data['merchant_responses'] = $merchant_responses;
        } else {
            $this->template_data['merchant_responses'] = '{}';
        }

        $this->template_data['bank_validation_attempts'] = $bank_validation_attempts;

        $view                           = $this->load->view('accounts/show_details', ['view_data' => $this->template_data], true);
        $this->template_data['content'] = $view;

        $this->load->view('main', $this->template_data);
    }

}
