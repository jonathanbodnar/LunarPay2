<?php

defined('BASEPATH') OR exit('No direct script access allowed');

require APPPATH . 'core/' . 'MY_Customer.php';

class Portal extends My_Customer {

    public function __construct() {
        parent::__construct();

        $this->load->use_theme('themed/thm2-c-portal/');
        $this->load->library(['form_validation']); //check csrf
    }

    //$config holds pl = payment_link + hash
    public function payment_link($hash) {

        $view_config = [
            'view'         => 'payment_link',
            'payment_link' => [
                'hash' => $hash
            ]
        ];

        $this->template_data['view_data'] = json_encode($view_config);
        $this->load->view('layout', $this->template_data);
    }

    //not yet, this will be if we move the invoice web customer app to the portal
    public function invoice($hash) {

        $view_config = [
            'view'         => 'invoice',
            'payment_link' => [
                'hash' => $hash
            ]
        ];

        $this->template_data['view_data'] = json_encode($view_config);
        $this->load->view('layout', $this->template_data);
    }

}
