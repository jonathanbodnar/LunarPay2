<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Customize_text extends My_Controller {

    public $data = [];

    public function __construct() {
        parent::__construct();

        if (!$this->ion_auth->logged_in()) {
            redirect('auth/login', 'refresh');
        }

        $this->template_data['view_index'] = $this->router->fetch_class() . '/' . $this->router->fetch_method();
        $this->load->use_theme();

        $this->load->model('customize_text_model');

        $this->load->library(['form_validation']);

        $this->lang->load(['auth']);

    }

    public function index() {

        $this->template_data['title'] = langx("Customize Text");

        //Getting Organizations
        $this->load->model('organization_model');
        $organizations = $this->organization_model->getList('ch_id,church_name,token');
        $this->template_data['organizations'] = $organizations;

        $view                         = $this->load->view('setting/customize_text', ['view_data' => $this->template_data], true);

        $this->template_data['content'] = $view;
        $this->load->view('main', $this->template_data);
    }

    public function get()
    {
        $organization_id    = (int)$this->input->post('organization_id');
        $suborganization_id = (int)$this->input->post('suborganization_id');

        $customize_texts= $this->customize_text_model->getCustomizeTexts($organization_id,$suborganization_id);

        output_json([
            'customize_texts'  => $customize_texts
        ]);
    }

    public function save()
    {
        if ($this->input->post()) {

            $this->form_validation->set_rules('organization_id', langx('company'), 'required');

            $user_id = $this->session->userdata('user_id');

            if ($this->form_validation->run() === TRUE) {
                $suborganization_id     = (int)$this->input->post('suborganization_id');
                $save_data = [
                    'chat_tree_id'      => (int)$this->input->post('chat_tree_id'),
                    'church_id'         => (int)$this->input->post('organization_id'),
                    'campus_id'         => $suborganization_id > 0 ? $suborganization_id : null,
                    'customize_text'     => $this->input->post('customize_text'),
                ];
            } else {
                output_json([
                    'status'  => false,
                    'message' => validation_errors()
                ]);
                return;
            }

            //Install or Update Customize Text
            $result = $this->customize_text_model->save($save_data, $user_id);

            if(!is_array($result)){
                output_json([
                    'status'  => true,
                    'id'      => $result,
                    'message' => 'Success'
                ]);
                return;
            } else {
                output_json($result);
                return;
            }
        }
    }
}
