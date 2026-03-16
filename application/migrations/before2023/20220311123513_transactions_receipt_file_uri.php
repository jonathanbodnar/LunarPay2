<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_transactions_receipt_file_uri extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_transactions_receipt_file_uri</p>");

        $this->db->query("ALTER TABLE `epicpay_customer_transactions`
	ADD COLUMN `receipt_file_uri_hash` VARCHAR(512) NULL DEFAULT NULL AFTER `payment_link_id`;
");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
