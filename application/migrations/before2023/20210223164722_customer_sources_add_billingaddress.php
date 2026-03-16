<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_customer_sources_add_billingaddress extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("ALTER TABLE `epicpay_customer_sources`
	ADD COLUMN `paysafe_billing_address` TEXT NULL DEFAULT NULL AFTER `paysafe_billing_address_id`;
");

        echo "Migration_customer_sources_add_billingaddress<br>";

        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
    }

    public function down() {
        
    }

}
