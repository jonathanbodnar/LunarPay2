<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_transactions_table_add_payment_link_fld extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_transactions_table_add_payment_link_fld</p>");

        $this->db->query("ALTER TABLE `epicpay_customer_transactions`
	ADD COLUMN `payment_link_id` INT(11) NULL DEFAULT NULL AFTER `invoice_id`,
	ADD INDEX `payment_link_id` (`payment_link_id`);
");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
