<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Referrals extends My_Controller {

    public $data = [];

    public function __construct() {
        parent::__construct();

        if (!$this->ion_auth->logged_in()) {
            redirect('auth/login', 'refresh');
        }
   
        $this->template_data['view_index'] = $this->router->fetch_class() . '/' . $this->router->fetch_method();
        $this->load->use_theme();
    }
    public function save_affiliate()
    {
        $this->load->model('user_model');
        try {
            $data = $this->input->post();
            output_json($this->user_model->update($data, $this->session->userdata('user_id'),true));
        } catch (Exception $ex) {

            // ---- if $this->donation_model->valAsArray = true
            // ---- we need to send the $ex->getMessage() as an one element array, without the stringifyFormatErrors
            // ---- thinking in the future, we may use this if we install an API

            output_json(['status' => false, 'errors' => stringifyFormatErrors([$ex->getMessage()]), 'exception' => true]);
        }
    }

    public function save()
    {
        $this->load->model('setting_model');
        if($this->setting_model->getItem('SYSTEM_LETTER_ID') !== 'H'){
                show_404();
        } 
        $this->load->model('referal_model');
        try {
            $data = $this->input->post();
            output_json($this->referal_model->save($data));
        } catch (Exception $ex) {

            // ---- if $this->donation_model->valAsArray = true
            // ---- we need to send the $ex->getMessage() as an one element array, without the stringifyFormatErrors
            // ---- thinking in the future, we may use this if we install an API

            output_json(['status' => false, 'errors' => stringifyFormatErrors([$ex->getMessage()]), 'exception' => true]);
        }
    }

    public function index() {

        $this->load->model('setting_model');
        $this->load->model('user_model');
        $this->load->model('referal_model');
        
        
        if($this->setting_model->getItem('SYSTEM_LETTER_ID') !== 'H' || !$this->session->userdata('is_affiliate')){
                show_404();
        } 
        $message = str_replace("[Dashboard-Admin-Name]", $this->session->userdata('user_name'), REFERRAL_SHARE_CODE_MESSAGE);
        $message = str_replace("[Organization-Name]", $this->session->userdata('currnt_org')['orgName'],$message);
        $user = $this->user_model->get($this->session->userdata('user_id'));
        $this->template_data['earnings']         =  $this->user_model->accounts_GetAffiliateEarnings();
        $this->template_data['payments']         =  $this->user_model->accounts_GetAffiliatePayments();
        $this->template_data['zelle_account']    =  $user->zelle_account_id;
        $this->template_data['referral_link']    =  referral_CreateLink($user->referral_code);
        
        $this->load->library(['form_validation']);
        
        $this->template_data['title']         = langx("Referrals");
        $this->template_data['message_referral']         = $message;
        $view                                 = $this->load->view('referrals/index', ['view_data' => $this->template_data], true);
        $this->template_data['content']       = $view;
        $this->load->view('main', $this->template_data);
    }
    
    public function referals_get_dt() {
        $this->load->model('referal_model');
        output_json($this->referal_model->getDt(), true);
    }
   


   

    

    

    
    
}
