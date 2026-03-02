<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_sources_trxns_add_bank_type extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_sources_add_bank_type</p>");

        $this->db->query("ALTER TABLE `epicpay_customer_sources`
	ADD COLUMN `bank_type` VARCHAR(5) NULL DEFAULT NULL AFTER `source_type`;");


        printd("<p>Migration_trxns_add_bank_type</p>");
        $this->db->query("ALTER TABLE `epicpay_customer_transactions`
	ADD COLUMN `bank_type` VARCHAR(5) NULL DEFAULT NULL AFTER `src`;");

        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
    }

    public function down() {
        
    }

}
