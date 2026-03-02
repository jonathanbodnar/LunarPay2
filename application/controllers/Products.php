<?php
defined('BASEPATH') OR exit('No direct script access allowed');
class Products extends My_Controller {

    public function __construct() {
        parent::__construct();

        if (!$this->ion_auth->logged_in()) {
            redirect('auth/login', 'refresh');
        }
        $this->template_data['view_index'] = $this->router->fetch_class() . '/' . $this->router->fetch_method();
        $this->load->use_theme();
        $this->load->library(['form_validation']);
    }

     public function index($param = false) {
        
         if($param == 'new') {
            $this->session->set_flashdata('new', true);
            redirect('/products'); //redirect with the new param on flash data for triggering the new modal
        }
        
        $this->template_data['title'] = langx("Products");
        $view                                 = $this->load->view('products/index', ['view_data' => $this->template_data], true);
        $this->template_data['content']       = $view;
        $this->load->view('main', $this->template_data);
    }
    public function get_dt(){
        $this->load->model('product_model');
       // die(print_r($this->product_model->getProducts()));
        output_json($this->product_model->getDt(), true);
    }
    public function remove() {
        try {
            $this->load->model('product_model');
            $id   = $this->input->post("id");
            $user_id = $this->session->userdata('user_id');
            $result  = $this->product_model->remove($id, $user_id);
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

    public function save()
    {
        $this->load->model('product_model');
        try {
            $data = $this->input->post();

            // ---- $this->product_model->valAsArray = true;

            $result = $this->product_model->save($data);

            output_json($result);
        } catch (Exception $ex) {

            // ---- if $this->donation_model->valAsArray = true
            // ---- we need to send the $ex->getMessage() as an one element array, without the stringifyFormatErrors
            // ---- thinking in the future, we may use this if we install an API

            output_json(['status' => false, 'errors' => stringifyFormatErrors([$ex->getMessage()]), 'exception' => true]);
        }
    }

    public function update(){
        $this->load->model('product_model');
        try {
            $data = $this->input->post();

            // ---- $this->product_model->valAsArray = true;

            $result = $this->product_model->update($data);

            output_json($result);
        } catch (Exception $ex) {

            output_json(['status' => false, 'errors' => stringifyFormatErrors([$ex->getMessage()]), 'exception' => true]);
        }
    }

    public function get_tags_list_pagination(){
        $this->load->model('product_model');
        output_json($this->product_model->get_tags_list_pagination());
    }

    public function get_tags_list_pagination_one_time(){
        $this->load->model('product_model');
        output_json($this->product_model->get_tags_list_pagination('recurrence = "O"'));
    }    
    
    public function profile($id) {

        $this->template_data['title'] = langx("products");
        $this->load->model('product_model');

        $profile = $this->product_model->getProductid($id);
        if (is_object($profile)) {

            $this->template_data['profile'] = $profile;

            $view = $this->load->view('products/profile', ['view_data' => $this->template_data], true);

            $this->template_data['content'] = $view;

            $this->load->view('main', $this->template_data);
        } else {
            show_404();
        }
    }

}
?>