<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_customers_bank_request extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_customers_bank_request</p>");

        $this->db->query("ALTER TABLE `epicpay_customers`
	ADD COLUMN `request_bank` LONGTEXT NULL DEFAULT NULL AFTER `request_response`;
");

        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
    }

    public function down() {
        
    }

}
