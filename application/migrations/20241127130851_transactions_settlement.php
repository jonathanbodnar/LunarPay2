<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_transactions_settlement extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_transactions_settlement</p>");

        $this->db->query("ALTER TABLE `epicpay_customer_transactions` ADD `transaction_batch_id` VARCHAR(50) NULL DEFAULT NULL COMMENT 'The batch the payment processor assigns for settlement' AFTER `fts_status_id`;");
        $this->db->query("ALTER TABLE `epicpay_customer_transactions` ADD `batch_status_id` TINYINT UNSIGNED NULL DEFAULT NULL COMMENT 'BATCH_TO_SETTLE=1; BATCH_SETTLED=2; BATCH_ERROR=3; BATCH_REPROCESS=4; BATCH_PROCESSING=5' AFTER `transaction_batch_id`;");
        
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
