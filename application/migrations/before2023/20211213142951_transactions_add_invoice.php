<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_transactions_add_invoice extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_transactions_add_invoice</p>");

        $this->db->query("ALTER TABLE `epicpay_customer_transactions`
	ADD COLUMN `invoice_id` INT(11) NULL DEFAULT NULL COMMENT 'When a payment is from an invoice' AFTER `transaction_detail`,
	ADD INDEX `invoice_id` (`invoice_id`);
");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
