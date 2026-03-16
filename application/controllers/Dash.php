<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Dash extends My_Controller {

    public $data = [];

    public function __construct() {
        parent::__construct();
    }

    public function auth($option = 'register') {
        if ($option != 'register')
            die;
        redirect('auth/register', 'refresh');
    }

}
