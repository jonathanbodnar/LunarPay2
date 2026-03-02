<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Batches extends My_Controller {

    public function __construct() {
        parent::__construct();

        if (!$this->ion_auth->logged_in()) {
            redirect('auth/login', 'refresh');
        }

        $this->template_data['view_index'] = $this->router->fetch_class() . '/' . $this->router->fetch_method();
        $this->load->use_theme();

        $this->load->library('form_validation'); //used for creating forms
    }

    public function index() {

        $this->template_data['title'] = langx("batches");

        $view = $this->load->view('batches/index', ['view_data' => $this->template_data], true);

        $this->template_data['content'] = $view;

        $this->load->view('main', $this->template_data);
    }

    public function get_dt() {
        $this->load->model('batches_model');
        output_json($this->batches_model->getDt(), true);
    }
    
     
    public function get_batch_donations_dt() {
        $this->load->model('batches_model');
        output_json($this->batches_model->getBatchDonationsDt(), true);
    }

    public function export_csv() {
        
    }

    public function get_batch_donors_dt() {
        output_json($this->subscription_model->getDt(), true);
    }

    public function get($id) {
        $this->load->model('batches_model');
        output_json($this->batches_model->get($id));
    }

    // ---- Code model
    public function create() {

        try {
            $data = $this->input->post();

            $this->load->model('batches_model');

            // ---- $this->donation_model->valAsArray = true;            

            $result = $this->batches_model->create($data);

            output_json($result);
        } catch (Exception $ex) {

            // ---- if $this->donation_model->valAsArray = true 
            // ---- we need to send the $ex->getMessage() as an one element array, without the stringifyFormatErrors 
            // ---- thinking in the future, we may use this if we install an API

            output_json(['status' => false, 'errors' => stringifyFormatErrors([$ex->getMessage()]), 'exception' => true]);
        }
    }

    public function update($batch_id) {

        try {
            $data = $this->input->post();

            $this->load->model('batches_model');

            // ---- $this->donation_model->valAsArray = true;            

            $data['id'] = $batch_id;
            $result     = $this->batches_model->update($data);

            output_json($result);
        } catch (Exception $ex) {

            // ---- if $this->donation_model->valAsArray = true 
            // ---- we need to send the $ex->getMessage() as an one element array, without the stringifyFormatErrors 
            // ---- thinking in the future, we may use this if we install an API

            output_json(['status' => false, 'errors' => stringifyFormatErrors([$ex->getMessage()]), 'exception' => true]);
        }
    }
    
    // ---- Code model
    public function create_transactions($batch_id) {
        
        try {
            
            $data = $this->input->post();

            $this->load->model('batches_model');
            // ---- $this->batches_model->valAsArray = true;            

            $result = $this->batches_model->createTransactions($data, $batch_id);

            output_json($result);
        } catch (Exception $ex) {

            // ---- if $this->donation_model->valAsArray = true 
            // ---- we need to send the $ex->getMessage() as an one element array, without the stringifyFormatErrors 
            // ---- thinking in the future, we may use this if we install an API

            output_json(['status' => false, 'errors' => stringifyFormatErrors([$ex->getMessage()]), 'exception' => true]);
        }
    }
    
    public function commit($batch_id) {

        try {
            $data = $this->input->post();

            $this->load->model('batches_model');

            // ---- $this->donation_model->valAsArray = true;            

            $data['id'] = $batch_id;
            $result     = $this->batches_model->commit($data);

            output_json($result);
        } catch (Exception $ex) {

            // ---- if $this->donation_model->valAsArray = true 
            // ---- we need to send the $ex->getMessage() as an one element array, without the stringifyFormatErrors 
            // ---- thinking in the future, we may use this if we install an API

            output_json(['status' => false, 'errors' => stringifyFormatErrors([$ex->getMessage()]), 'exception' => true]);
        }
    }

    public function get_tags_list_all() {

        $this->load->model('tags_model');
        output_json($this->tags_model->get_tags_list());
    }
}
