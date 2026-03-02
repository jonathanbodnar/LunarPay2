<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Payment_links extends My_Controller {

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

        $this->template_data['title']         = langx("Payment Links");
        $view                                 = $this->load->view('payment_links/index', ['view_data' => $this->template_data], true);
        $this->template_data['content']       = $view;
        $this->load->view('main', $this->template_data);
    }

    public function get_dt() {
        $this->load->model('payment_link_model');
        output_json($this->payment_link_model->getDt(), true);
    }

    public function update()
    {    
        $this->load->model('payment_link_model');
        $this->load->model('payment_link_product_model');
        try {
            $data = $this->input->post();
            $response = $this->payment_link_model->update($data);
            $this->payment_link_product_model->editBulk($data['products']);
            output_json($response);
        } catch (Exception $ex) {
            // ---- if $this->donation_model->valAsArray = true
            // ---- we need to send the $ex->getMessage() as an one element array, without the stringifyFormatErrors
            // ---- thinking in the future, we may use this if we install an API
            output_json(['status' => false, 'errors' => stringifyFormatErrors([$ex->getMessage()]), 'exception' => true]);
        }
    }
 

    public function save()
    {
        $this->load->model('payment_link_model');
        try {
            $data = $this->input->post();
            $result = $this->payment_link_model->save($data);
            output_json($result);
        } catch (Exception $ex) {
            // ---- if $this->donation_model->valAsArray = true
            // ---- we need to send the $ex->getMessage() as an one element array, without the stringifyFormatErrors
            // ---- thinking in the future, we may use this if we install an API
            output_json(['status' => false, 'errors' => stringifyFormatErrors([$ex->getMessage()]), 'exception' => true]);
        }
    }

    public function view($id){
        $this->load->library(['form_validation']);
        $this->load->model('payment_link_model');
        try {   

            $links = $this->payment_link_model->getById($id);
            
            if(!$links){
                show_404();
            } 
           
            $view                                 = $this->load->view('payment_links/view',['links' => $links ], true);
            $this->template_data['content']       = $view;
            $this->load->view('main', $this->template_data);
        } catch (Exception $ex) {
            output_json(['status' => false, 'errors' => stringifyFormatErrors([$ex->getMessage()]), 'exception' => true]);
        }
    }

    public function remove() {
        try {
            $this->load->model('payment_link_model');
            $id   = $this->input->post();
            $user_id = $this->session->userdata('user_id');
            $result  = $this->payment_link_model->remove($id['id'], $user_id);
            output_json([
                'status'  => $result['status'],
                'message' => $result['message']
            ]);
        } catch (Exception $ex) {

            // ---- if $this->donation_model->valAsArray = true 
            // ---- we need to send the $ex->getMessage() as an one element array, without the stringifyFormatErrors 
            // ---- thinking in the future, we may use this if we install an API

            output_json(['status' => false, 'errors' => stringifyFormatErrors([$ex->getMessage()]), 'exception' => true]);
        }
    }

    public function get($hash) {
        $this->load->model('invoice_model');
        output_json($this->invoice_model->getByHash($hash));
    }
}
