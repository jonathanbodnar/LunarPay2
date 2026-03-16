<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_customer_transactions_manual_trx_type extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_customer_transactions_manual_trx_type</p>");

        $this->db->query("ALTER TABLE `epicpay_customer_transactions`
	ADD COLUMN `manual_trx_type` CHAR(2) NULL DEFAULT NULL COMMENT 'It is when adding a transaction comming not from a donor directly, commonly added by the dashboard admin, it can be a normal transaction, a donation, a expense, batches, etc ...' AFTER `paysafeRef`,
	ADD INDEX `manual_trx_type` (`manual_trx_type`);
");
        $this->db->query("ALTER TABLE `epicpay_customer_transactions`
	ADD COLUMN `transaction_detail` TEXT NULL DEFAULT NULL AFTER `manual_trx_type`,
        ADD INDEX `transaction_detail` (`transaction_detail`(192));
");                
   
        $this->db->query("ALTER TABLE `epicpay_customer_transactions`
	COMMENT='If a transaction comes from a campus (campus_id) it must include its main organization too';");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
