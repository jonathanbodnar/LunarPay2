<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Dashboard extends My_Controller {

    protected $view_index = '';

    public function __construct() {
        parent::__construct();

        if (!$this->ion_auth->logged_in()) {
            redirect('auth/login', 'refresh');
        }
        $this->template_data['view_index'] = $this->router->fetch_class() . '/' . $this->router->fetch_method();
        $this->load->use_theme();
    }

    public function v1() {

        $this->template_data['title'] = 'Dashboard V1';
        $this->template_data['subtitle'] = 'Dashboard V1';

        $view = $this->load->view('dashboard/dashboard_v1', [], true);
        $this->template_data['content'] = $view;

        $this->load->view('main', $this->template_data);
    }

    public function v2() {
        $this->template_data['title'] = 'Dashboard V2';
        $this->template_data['subtitle'] = 'Dashboard V2';

        $view = $this->load->view('dashboard/dashboard_v2', [], true);
        $this->template_data['content'] = $view;

        $this->load->view('main', $this->template_data);
    }

    public function v3() {
        $this->template_data['title'] = 'Dashboard V3';
        $this->template_data['subtitle'] = 'Dashboard V3';

        $view = $this->load->view('dashboard/dashboard_v3', [], true);
        $this->template_data['content'] = $view;

        $this->load->view('main', $this->template_data);
    }

    public function myprofile(){
        $this->load->library(['form_validation']);
        $this->load->model('user_model');

        $id = $this->session->userdata('is_child') ? $this->session->userdata('child_id') : $this->session->userdata('user_id');

        $this->template_data['title']       = langx("my_profile");

        //Getting Profile Info
        $user  = $this->user_model->get($id, 'id, first_name, last_name, email, phone');
        
        if($user){
            $this->template_data['profile'] = $user;

            $view  = $this->load->view('dashboard/myprofile', ['view_data' => $this->template_data], true);

            $this->template_data['content'] = $view;

            $this->load->view('main', $this->template_data);
        }
        else{
            show_404();
        }
    }

    public function save_profile() {
        if ($this->input->post()) {

            $this->load->library(['form_validation']);

            $user_id = $this->session->userdata('is_child') ? $this->session->userdata('child_id') : $this->session->userdata('user_id');
            
            $this->form_validation->set_rules('first_name', langx('first_name'), 'trim|required');
            $this->form_validation->set_rules('last_name', langx('last_name'), 'trim|required');
            $this->form_validation->set_rules('phone', langx('phone'), 'trim|required');
            if ($this->form_validation->run() === TRUE) {

                $data = array(
                    'first_name'       => $this->input->post('first_name'),
                    'last_name'        => $this->input->post('last_name'),
                    'phone'            => $this->input->post('phone')
                );

                if ($user_id)  {//===== update mode
                    $this->load->model('user_model');
                    $result = $this->user_model->update($data, $user_id);
                    if ($result === TRUE) {
                        output_json([
                            'status'  => true,
                            'message' => sprintf(langx('update_success'), langx('profile'))
                        ]);
                        return;
                    }else{
                        output_json($result);
                        return;
                    }
                }
                else{
                    output_json([
                        'status'  => false,
                        'message' => 'Invalid Id',
                    ]);
                    return;
                }
            }
            output_json([
                'status'  => false,
                'message' => validation_errors()
            ]);
        }
    }

    public function change_password(){
        $old = $this->input->post('current_password');
        $new = $this->input->post('new_password');
        $identity = $this->session->userdata('identity');

        $this->load->model('ion_auth_model');
        $result = $this->ion_auth_model->change_password($identity,$old,$new);

        if($result){
            output_json(['status' => true, 'message' => $this->ion_auth->messages()]);
        } else {
            output_json(['status' => false, 'message' =>  $this->ion_auth->errors()]);
        }

    }
}
