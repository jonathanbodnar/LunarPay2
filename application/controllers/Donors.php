<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Donors extends My_Controller {

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

        $this->load->model('donor_model');    
        
        $this->load->model('donation_model');
    }

    public function index() {

        $this->template_data['title'] = langx("customers");

        //Getting is_new_donor_before_days data
        $this->load->model('setting_model');
        $this->template_data['is_new_donor_before_days'] = $this->setting_model->getItem('is_new_donor_before_days');

        $view = $this->load->view('donor/donor', ['view_data' => $this->template_data], true);

        $this->template_data['content'] = $view;

        $this->load->view('main', $this->template_data);
    }

    public function get_donors_dt() {
        output_json($this->donor_model->getDt(), true);
    }

     public function get_donations_dt_customer() {       
         output_json($this->donation_model->getCustomerDt(null,null), true);
    }
    
    public function get()
    {
        $id = $this->input->post('id');
        $donor = $this->donor_model->get($id,false,true, $this->session->userdata('user_id'));

        output_json([
            'donor' => $donor
        ]);
    }

    public function get_max_amount() {
        output_json($this->donor_model->getMaxAmount());
    }

    public function profile($id) {
        
        $this->template_data['title'] = langx("customers");

        //Getting Profile Info
        $profile = $this->donor_model->getProfile($id);
        if (is_object($profile)) {
            //===== profile id is safe, sources can be directly queried
            $this->load->model('sources_model');
            $profile->saved_sources = $this->sources_model->getList($id, 'id asc');
            
            if($profile->first_date) {
                $profile->first_date_formatted = date('m/d/Y', strtotime($profile->first_date));
            } else {
                $profile->first_date_formatted = null;
            }
            
            $this->template_data['profile'] = $profile;

            $view = $this->load->view('donor/profile', ['view_data' => $this->template_data], true);

            $this->template_data['content'] = $view;

            $this->load->view('main', $this->template_data);
        } else {
            show_404();
        }
    }

    public function save() {

        try {
            $data = $this->input->post();

            // ---- $this->donation_model->valAsArray = true;

            $result = $this->donor_model->save($data);

            output_json($result);
        } catch (Exception $ex) {

            // ---- if $this->donation_model->valAsArray = true
            // ---- we need to send the $ex->getMessage() as an one element array, without the stringifyFormatErrors
            // ---- thinking in the future, we may use this if we install an API

            output_json(['status' => false, 'errors' => stringifyFormatErrors([$ex->getMessage()]), 'exception' => true]);
        }
    }

    public function save_profile() {
        if ($this->input->post()) {

            $donor_id = (int) $this->input->post('id');

            $this->form_validation->set_rules('first_name', langx('first_name'), 'trim|required');
            $this->form_validation->set_rules('last_name', langx('last_name'), 'trim');
            $this->form_validation->set_rules('email', langx('email'), 'trim|required');
            if ($this->form_validation->run() === TRUE) {

                //Current Donor Phone
                $current_donor  = $this->donor_model->get(['id' => $donor_id], ['id_church','phone','phone_code']);
                $phone_number   = $this->input->post('phone');
                $phone_code     = $this->input->post('phone_code');

                //Validating Phone Number
                if($phone_number && (!is_numeric($phone_number) || strlen($phone_number) > 15)){
                    output_json([
                        'status'  => false,
                        'message' => '<p>Invalid Phone Number</p>'
                    ]);
                    return;
                }
                $phone_changed = false;
                if($phone_number != null){
                    if($current_donor->phone_code.$current_donor->phone != $phone_code.$phone_number){
                        $phone_changed = true;
                    }
                }

                if($phone_changed && $phone_number){
                    $user_repeated = $this->donor_model->getLoginData(null,$current_donor->id_church,$phone_number,$phone_code);
                    if($user_repeated){
                        output_json([
                            'status'  => false,
                            'message' => '<p>Phone has already been registered, please enter a different one</p>'
                        ]);
                        return;
                    }
                }

                $data = array(
                    'id'                 => $donor_id,
                    'first_name'         => $this->input->post('first_name'),
                    'last_name'          => $this->input->post('last_name'),
                    'email'              => $this->input->post('email'),
                    'phone'              => $this->input->post('phone'),
                    'country_code_phone' => $this->input->post('country_code_phone'),
                    'phone_code'         => $this->input->post('phone_code'),
                    'address'            => $this->input->post('address'),
                );

                if ($donor_id) {//===== update mode
                    $result = $this->donor_model->update_profile($data);
                    if ($result === TRUE) {
                        output_json([
                            'status'  => true,
                            'message' => sprintf(langx('update_success'), langx('profile'))
                        ]);
                        return;
                    } else {
                        output_json($result);
                        return;
                    }
                } else {
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

    public function get_tags_list() {        
        output_json($this->donor_model->get_tags_list());        
    }

    public function get_tags_list_pagination() {
        output_json($this->donor_model->get_tags_list_pagination());
    }
}
