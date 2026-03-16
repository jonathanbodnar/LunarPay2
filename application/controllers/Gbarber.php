<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Gbarber extends My_Controller {

    public $data = [];

    public function __construct() {
        parent::__construct();

        $action = $this->router->method;
        $free   = ['login', 'test'];
        /* ------- ---------------- ------ */

        if (!in_array($action, $free)) {
            if (!$this->ion_auth->logged_in()) {
                redirect('auth/login', 'refresh');
            }
        }
    }

    public function validate_app() {

        $this->load->model('user_model');
        $user_id = $this->session->userdata('user_id');
        $user    = $this->user_model->get($user_id, 'id, gbarber_app_status, gbarber_app_url');

        if ($user->gbarber_app_status == 'V') {
            output_json(['status' => true, 'app_already_created' => true, 'app_url' => $user->gbarber_app_url]);
            return;
        }

        $result                        = $this->validateCanCreateApp();
        $result['app_already_created'] = false;
        output_json($result);
    }

    //====== login to goodbarber, validate app name allowed, create app, add team member
    public function create_app() {
        
        $result = $this->validateCanCreateApp();
        if ($result['status'] == false) {
            output_json($result);
            return;
        }

        $this->load->library('gbbot');

        //===== login
        $app_name = $this->input->post('app_name');
        $response = $this->gbbot->login();
        
        if ($response !== true) {
            output_json([
                'status'  => false,
                'message' => $response
            ]);
            return;
        }

        //===== validate app name
        $response = $this->gbbot->call_checkapp($app_name);
        if ($response) { //==== a problem ocurred, message in the response
            output_json([
                'status'  => false,
                'message' => $response
            ]);
            return;
        }

        //===== create app        
        $response = $this->gbbot->call_createapp($app_name);
        $this->load->model('user_model');
        $user_id  = $this->session->userdata('user_id');

        $save_data['gbarber_app_created_attempt'] = date('Y-m-d H:i:s');
        if ($response != 'ok') {
            $save_data['gbarber_app_status'] = 'E';

            $this->user_model->update($save_data, $user_id);

            output_json([
                'status'  => false,
                'message' => 'An error ocurred while attempting to create the app'
            ]);
            return;
        }

        $save_data['gbarber_app_status'] = 'V';
        $save_data['gbarber_app_url']    = 'https://' . $app_name . '.' . GOODBARBER_APPS_DOMAIN . '/';
        $this->user_model->update($save_data, $user_id);

        //====== add team member
        $data_app_user['gbarber_app_url'] = $save_data['gbarber_app_url'];
        $this->gbbot->app_login_user($data_app_user);
        $data_app_user['email']           = $this->session->userdata('email');
        $this->gbbot->app_add_team_member($data_app_user);
        //======

        output_json([
            'status'  => true,
            'message' => 'App successfully created, please verify your email and get login to the app.'
        ]);
    }

    private function validateCanCreateApp() {

        if (GOODBARBER_APP_WITH_ORGNX == FALSE) {
            return ['status' => true, 'data' => ['suggested_name' => '']];
        }

        $this->load->model('organization_model');
        $user_id = $this->session->userdata('user_id');
        $orgnx   = $this->organization_model->getWhere('ch_id, church_name', ['client_id' => $user_id, 'epicpay_verification_status' => 'V'], false, 'ch_id ASC');

        if (!$orgnx) {
            return (['status' => false, 'message' => 'Please create and activate an organization before registering for your free church app']);
        }

        return (['status' => true, 'data' => ['suggested_name' => strtolower(preg_replace('/[^a-zA-Z0-9]+/', '', $orgnx[0]->church_name))]]);
    }

}
