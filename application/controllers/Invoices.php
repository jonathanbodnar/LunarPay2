<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Invoices extends My_Controller {

    public $data = [];

    public function __construct() {
        parent::__construct();

        if (!$this->ion_auth->logged_in()) {
            redirect('auth/login', 'refresh');
        }

        $this->template_data['view_index'] = $this->router->fetch_class() . '/' . $this->router->fetch_method();
        $this->load->use_theme();
    }

    public function index($param = false) {
        
        if($param == 'new') {
            $this->session->set_flashdata('new', true);
            redirect('/invoices'); //redirect with the new param on flash data for triggering the new modal
        }
        
        $this->load->library(['form_validation']);
        $this->load->model('organization_model');
        $this->load->model('donor_model');

        $this->template_data['title']         = langx("Invoices");
        $this->template_data['organizations'] = $this->organization_model->getList(['ch_id', 'church_name'], 'ch_id ASC');
        $view                                 = $this->load->view('invoice/index', ['view_data' => $this->template_data], true);
        $this->template_data['content']       = $view;
        $this->load->view('main', $this->template_data);
    }

    public function get_dt() {
        $this->load->model('invoice_model');
        output_json($this->invoice_model->getDt(), true);
    }

    public function save()
    {
        $this->load->model('invoice_model');
        try {
            $data = $this->input->post();
            // ---- $this->product_model->valAsArray = true;
            $result = $this->invoice_model->save($data);

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
        $this->load->model('invoice_model');
        try {
            $invoice = $this->invoice_model->getById($id);
            if(!$invoice || $invoice->status === invoice_model::INVOICE_DRAFT_STATUS){
                show_404();
            } 
            $view                                 = $this->load->view('invoice/view',['invoice' => $invoice ], true);
            $this->template_data['content']       = $view;
            $this->load->view('main', $this->template_data);
        } catch (Exception $ex) {
            output_json(['status' => false, 'errors' => stringifyFormatErrors([$ex->getMessage()]), 'exception' => true]);
        }
    }

    public function clone_invoice()
    {
        $this->load->model('invoice_model');
        try {
            $data = $this->input->post(); 
            $result = $this->invoice_model->clone_invoice($data["id"]);
            output_json($result);
        } catch (Exception $ex) {

            // ---- if $this->donation_model->valAsArray = true
            // ---- we need to send the $ex->getMessage() as an one element array, without the stringifyFormatErrors
            // ---- thinking in the future, we may use this if we install an API

            output_json(['status' => false, 'errors' => stringifyFormatErrors([$ex->getMessage()]), 'exception' => true]);
        }
    }


    public function remove()
    {
        $this->load->model('invoice_model');
        try {
            
            $result = $this->invoice_model->remove($this->input->post('hash'),$this->session->userdata('session_id'));

            output_json($result);
        } catch (Exception $ex) {

            // ---- if $this->donation_model->valAsArray = true
            // ---- we need to send the $ex->getMessage() as an one element array, without the stringifyFormatErrors
            // ---- thinking in the future, we may use this if we install an API

            output_json(['status' => false, 'errors' => stringifyFormatErrors([$ex->getMessage()]), 'exception' => true]);
        }
    }

    public function send_to_customer($hash) {
        $this->load->helper('emails');
        $this->load->model('invoice_model');
        try {
            $this->load->model('invoice_model');
            $invoiceFullData = $this->invoice_model->getByHash($hash);
            $result = sendInvoiceEmail($invoiceFullData,'pay');
            output_json($result);            
        } catch (Exception $ex) {            
            output_json(['status' => false, 'message' => $ex->getMessage(), 'exception' => true]);
        }
    }
    
    public function cancel($id) {                
        try {
            $this->load->model('invoice_model');            
            $result = $this->invoice_model->markInvoiceAsCanceled($id);
            output_json($result);            
        } catch (Exception $ex) {            
            output_json(['status' => false, 'message' => $ex->getMessage(), 'exception' => true]);
        }
    }

    public function get($hash) {
        $this->load->model('invoice_model');
        output_json($this->invoice_model->getByHash($hash));
    }
}
