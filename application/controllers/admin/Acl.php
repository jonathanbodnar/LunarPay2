<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Acl extends My_Controller {///

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

        $this->template_data['title'] = langx("Admin Users");

        $this->template_data['identity_column'] = $this->config->item('identity', 'ion_auth');
        
        $view                                   = $this->load->view('acl/acl', ['view_data' => $this->template_data], true);
        $this->template_data['content']         = $view;

        $this->load->view('main', $this->template_data);
    }

    public function get_users_dt() {
        $this->load->model('admin/user_model');
        output_json($this->user_model->getDt(), true);
    }

    public function get_groups_list() {
        $limit  = 30;
        $offset = ($this->input->post('page') ? $this->input->post('page') : 0) * $limit;

        $this->db->select('SQL_CALC_FOUND_ROWS id, name as text', false);
        $this->input->post('q') ? $this->db->like('name', $this->input->post('q')) : true;
        $data = $this->db->limit($limit, $offset)->get('zadm_groups')->result();

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

    public function save_user() {
        if ($this->input->post()) {
            
            $tables                        = $this->config->item('tables', 'ion_auth');
            $identity_column               = $this->config->item('identity', 'ion_auth');
            $this->data['identity_column'] = $identity_column;

            $user_id = $this->input->post('id');

            $this->form_validation->set_rules('first_name', $this->lang->line('create_user_validation_fname_label'), 'trim|required');
            $this->form_validation->set_rules('last_name', $this->lang->line('create_user_validation_lname_label'), 'trim|required');
            if ($identity_column !== 'email') {
                $this->form_validation->set_rules('identity', $this->lang->line('create_user_validation_identity_label'), 'trim|required|is_unique[' . $tables['users'] . '.' . $identity_column . ']');
                $this->form_validation->set_rules('email', $this->lang->line('create_user_validation_email_label'), 'trim|required|valid_email');
            } else {
                if (!$user_id) {
                    $this->form_validation->set_rules('email', $this->lang->line('create_user_validation_email_label'), 'trim|required|valid_email|is_unique[' . $tables['users'] . '.email]');
                } else {
                    $this->form_validation->set_rules('email', $this->lang->line('create_user_validation_email_label'), 'trim|required|valid_email');
                }
            }

            if (!$user_id || ($user_id && $this->input->post('password'))) {
                $this->form_validation->set_rules('password', $this->lang->line('create_user_validation_password_label'), 'required|min_length[' . $this->config->item('min_password_length', 'ion_auth') . ']|matches[password_confirm]');
                $this->form_validation->set_rules('password_confirm', $this->lang->line('create_user_validation_password_confirm_label'), 'required');
            }

            if ($this->form_validation->run() === TRUE) {
                $email    = strtolower($this->input->post('email'));
                $identity = ($identity_column === 'email') ? $email : $this->input->post('identity');
                $password = $this->input->post('password');

                $additional_data = [
                    'first_name' => $this->input->post('first_name'),
                    'last_name'  => $this->input->post('last_name'),
                    'company'    => $this->input->post('company'),
                    'phone'      => $this->input->post('phone'),
                    'role'       => 'admin',
                ];
                $groups          = [2];

                if (!$user_id) {//===== create mode
                    $user_id = $this->ion_auth->register($identity, $password, $email, $additional_data, $groups);
                    if ($user_id) {
                        output_json([
                            'status'  => true,
                            'message' => $this->ion_auth->messages()
                        ]);
                        return;
                    }
                } else {//===== update mode
                    if ($this->input->post('password')) {
                        $additional_data['password'] = $this->input->post('password');
                    }
                    if ($this->ion_auth->is_admin()) {
                        $this->ion_auth->remove_from_group('', $user_id);
                        foreach ($groups as $grp) {
                            $this->ion_auth->add_to_group($grp, $user_id);
                        }
                    }
                    if ($this->ion_auth->update($user_id, $additional_data)) {
                        output_json([
                            'status'  => true,
                            'message' => $this->ion_auth->messages()
                        ]);
                        return;
                    }
                }
            }
            output_json([
                'status'  => false,
                'message' => (validation_errors() ? validation_errors() : $this->ion_auth->errors())
            ]);
        }
    }

}
