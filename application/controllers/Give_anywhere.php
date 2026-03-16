<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Give_anywhere extends My_Controller
{
    public function __construct()
    {
        parent::__construct();

        if (!$this->ion_auth->logged_in()) {
            redirect('auth/login', 'refresh');
        }

        $this->template_data['view_index'] = $this->router->fetch_class() . '/' . $this->router->fetch_method();
        $this->load->use_theme();

        $this->load->library(['form_validation']);

        $this->lang->load(['auth']);

        $this->load->model('give_anywhere_model');
    }

    public function index()
    {
        $this->template_data['title'] = langx("Give Anywhere Buttons");

        //Getting Organizations
        $this->load->model('organization_model');
        $organizations = $this->organization_model->getList('ch_id,church_name,token');
        $this->template_data['organizations'] = $organizations;

        $view = $this->load->view('create/giveanywhere', ['view_data' => $this->template_data], true);

        $this->template_data['content'] = $view;

        $this->load->view('main', $this->template_data);
    }

    public function get_give_anywhere_dt(){
        output_json($this->give_anywhere_model->getDt(), true);
    }

    public function get_give_anywhere()
    {

        $id = $this->input->post('id');
        $give_anywhere = $this->give_anywhere_model->get($id, $this->session->userdata('user_id'));

        output_json([
            'give_anywhere' => $give_anywhere
        ]);
    }

    public function save_give_anywhere()
    {
        if ($this->input->post()) {

            $this->form_validation->set_rules('organization_id', langx('company'), 'required');
            $this->form_validation->set_rules('button_color', langx('button_color'), 'required');
            $this->form_validation->set_rules('text_color', langx('text_color'), 'required');
            $this->form_validation->set_rules('button_text', langx('button_text'), 'required');
            $user_id = $this->session->userdata('user_id');

            if ($this->form_validation->run() === TRUE) {

                $organization_id = (int)$this->input->post('organization_id');
                $suborganization_id = (int)$this->input->post('suborganization_id');

                $save_data = [
                    'id' => (int)$this->input->post('id'),
                    'church_id' => $organization_id > 0 ? $organization_id : null,
                    'campus_id' => $suborganization_id > 0 ? $suborganization_id : null,
                    'button_color' => $this->input->post('button_color'),
                    'text_color' => $this->input->post('text_color'),
                    'button_text' => $this->input->post('button_text')
                ];
            } else {
                output_json([
                    'status' => false,
                    'message' => validation_errors()
                ]);
                return;
            }

            $save_data['client_id'] = $user_id;

            //Create or Update Give Anywhere
            $result = $this->give_anywhere_model->save($save_data);

            if ($result) {
                output_json([
                    'status' => true,
                    'id' => $result,
                    'message' => 'Give Anywhere Button has been saved'
                ]);
                return;
            } else {
                output_json($result);
                return;
            }
        }
    }

}
