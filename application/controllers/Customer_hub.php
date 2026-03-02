<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Customer_hub extends My_Controller {

    public $data = [];

    public function __construct() {
        parent::__construct();

        if (!$this->ion_auth->logged_in()) {
            redirect('auth/login', 'refresh');
        }
   
        $this->template_data['view_index'] = $this->router->fetch_class() . '/' . $this->router->fetch_method();
        $this->load->use_theme();
    }

    public function index() {
        
        $this->load->library(['form_validation']);

        $this->template_data['title']         = langx("Customer portal");
        
        $this->load->helper('crypt');

        $orgId                                = $this->session->userdata('currnt_org')['orgnx_id'];
        
        if(IS_DEVELOPER_MACHINE) {
            $this->template_data['slug']          = $orgId; //merchantSlugEncode($orgId);
        } else {
            $this->template_data['slug']          = merchantSlugEncode($orgId);
        }
        $view                                 = $this->load->view('customer_hub/index', ['view_data' => $this->template_data], true);
        $this->template_data['content']       = $view;
        $this->load->view('main', $this->template_data);
    }    
}
