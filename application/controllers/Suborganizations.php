<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Suborganizations extends My_Controller {

    public $data = [];

    public function __construct() {
        parent::__construct();

        if (!$this->ion_auth->logged_in()) {
            redirect('auth/login', 'refresh');
        }

        $this->template_data['view_index'] = $this->router->fetch_class() . '/' . $this->router->fetch_method();
        $this->load->use_theme();

        $this->load->library(['form_validation']);

        $this->lang->load(['auth']);

        $this->load->model('suborganization_model');
    }

    public function index() {

        $this->template_data['title']       = langx("sub_organizations");

        //Getting Organizations
        $this->load->model('organization_model');
        $organizations = $this->organization_model->getList();
        $this->template_data['organizations'] = $organizations;

        $view                               = $this->load->view('suborganization/suborganization', ['view_data' => $this->template_data], true);

        $this->template_data['content'] = $view;

        $this->load->view('main', $this->template_data);
    }

    public function get_suborganizations_dt() {
        output_json($this->suborganization_model->getDt(), true);
    }

    public function get_suborganizations_list() {
        output_json($this->suborganization_model->getList());
    }

    public function get_suborganization() {

        $id              = $this->input->post('id');
        $suborganization = $this->suborganization_model->get($id);

        output_json([
            'suborganization' => $suborganization
        ]);
    }

    public function save_suborganization() {
        if ($this->input->post()) {           

            $suborganization_id = (int) $this->input->post('id');

            $this->form_validation->set_rules('suborganization_name', langx('suborganization_name'), 'trim|required');
            if (!$suborganization_id) {
                $this->form_validation->set_rules('organization_id', langx('company'), 'required');
            }
            $this->form_validation->set_rules('address', langx('address'), 'trim|required');
            $this->form_validation->set_rules('phone', langx('phone'), 'trim|required');
            $this->form_validation->set_rules('pastor', langx('pastor'), 'trim|required');
            $this->form_validation->set_rules('description', langx('description'), 'trim|required');
            if ($this->form_validation->run() === TRUE) {

                $data = array(
                    'id'            => $suborganization_id,
                    'name'          => preg_replace('/\s\s+/', ' ', $this->input->post('suborganization_name')),
                    'church_id'     => $this->input->post('organization_id'),
                    'phone'         => $this->input->post('phone'),
                    'address'       => $this->input->post('address'),
                    'pastor'        => $this->input->post('pastor'),
                    'description'   => $this->input->post('description'),
                );

                if (!$suborganization_id) {//===== create mode
                    $suborganization_id = $this->suborganization_model->register($data);
                    if ($suborganization_id) {
                        $slug = strtolower(str_replace(' ','-',trim($data['name']) ));
                        $suborganization_slug = $this->suborganization_model->getBySlug($slug);
                        if($suborganization_slug){
                            $slug .= '-'.$suborganization_id;
                        }
                        $this->suborganization_model->setSlug($suborganization_id,$slug);

                        $this->load->model('chat_setting_model');
                        $data_chat_setting = [
                            'id'                => 0,
                            'client_id'         => $this->session->userdata('user_id'),
                            'church_id'         => $this->input->post('organization_id'),
                            'campus_id'         => $suborganization_id,
                            'suggested_amounts' => '["10","30","50","100"]',
                            'theme_color'       => '#000000',
                            'button_text_color' => '#ffffff'
                        ];
                        $this->chat_setting_model->save($data_chat_setting);


                        output_json([
                            'status'  => true,
                            'message' => sprintf(langx('register_success'), langx('sub_organization'))
                        ]);
                        return;
                    }
                } else {//===== update mode
                    //Disable Organization (Church) Update
                    unset($data['church_id']);
                    $result = $this->suborganization_model->update($data);
                    if ($result === TRUE) {
                        output_json([
                            'status'  => true,
                            'message' => sprintf(langx('update_success'), langx('sub_organization'))
                        ]);
                        return;
                    }else{
                        output_json($result);
                        return;
                    }
                }
            }
            output_json([
                'status'  => false,
                'message' => validation_errors()
            ]);
        }
    }

}
