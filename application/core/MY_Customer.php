<?php

defined('BASEPATH') OR exit('No direct script access allowed');

//My_Customer is used as base for the customer controllers

class My_Customer extends CI_Controller {

    public function __construct() {
        parent::__construct();

        if (CURRENT_SYSTEM !== 'WIDGET' && !IS_DEVELOPER_MACHINE) {
            //My_Customer is the main parent class for all customer controllers            
            //show_404();
            //die;
        }
    }

}
