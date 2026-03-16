<?php

defined('BASEPATH') OR exit('No direct script access allowed');

require APPPATH . 'core/' . 'MY_Customer.php';

class Invoice extends My_Customer {
    public function __construct() {
        parent::__construct();
        $this->template_data['view_index'] = $this->router->fetch_class() . '/invoice';// . $this->router->fetch_method();
        $this->load->use_theme('themed/thm2-customer/');
        $this->load->library(['form_validation']);
    }
    public function index($invoice_hash) {
        $data = ['hash' => $invoice_hash];
        $view = $this->load->view('/invoice', ['view_data' => $data], true);
        $this->template_data['content'] = $view;
        $this->load->view('layout', $this->template_data);
    }
}
