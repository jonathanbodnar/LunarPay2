<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Referrals extends My_Controller {

    public $data = [];

    public function __construct() {
        parent::__construct();

        if (!$this->ion_auth->logged_in() && $this->session->userdata('role') === 'admin') {
            redirect('auth/login', 'refresh');
        }
   
        $this->template_data['view_index'] = $this->router->fetch_class() . '/' . $this->router->fetch_method();
        $this->load->use_theme(THEME_LAYOUT_ADMIN);
    }
     
    public function view($id) {
        $this->load->model('admin/referal_model');
        $this->load->model('admin/payment_affiliate_model');
        $this->load->library(['form_validation']);
        $this->template_data['referrals'] = $this->referal_model->getReferralsByUserId($id);
        $this->template_data['payments'] = $this->payment_affiliate_model->getPaymentsByUserId($id);
        $this->template_data['title']         = langx("Affiliates");
        $view                                 = $this->load->view('referrals/view', ['view_data' => $this->template_data], true);
        $this->template_data['content']       = $view;
        $this->load->view('main', $this->template_data);
    }

    public function payment_affiliate()
    {
        $this->load->model('admin/payment_affiliate_model');
        try {
            $data = $this->input->post();
            $result = $this->payment_affiliate_model->save($data);
            output_json($result);
        } catch (Exception $ex) {
            // ---- if $this->donation_model->valAsArray = true
            // ---- we need to send the $ex->getMessage() as an one element array, without the stringifyFormatErrors
            // ---- thinking in the future, we may use this if we install an API
            output_json(['status' => false, 'errors' => stringifyFormatErrors([$ex->getMessage()]), 'exception' => true]);
        }
    }
     

    public function index() {

        $this->load->library(['form_validation']);
        
        $this->template_data['title']         = langx("Affiliates");
        $view                                 = $this->load->view('referrals/index', ['view_data' => $this->template_data], true);
        $this->template_data['content']       = $view;
        $this->load->view('main', $this->template_data);
    }
    
    public function affiliates_get_dt() {        
        $this->load->model('admin/accounts_model');
        output_json($this->accounts_model->getAfiliateDT(), true);
    }
   


   

    

    

    
    
}
