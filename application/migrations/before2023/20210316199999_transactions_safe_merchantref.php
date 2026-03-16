<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_transactions_safe_merchantref extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_transactions_safe_merchantref</p>");

        $this->db->query("ALTER TABLE `epicpay_customer_transactions`
	ADD COLUMN `paysafeRef` VARCHAR(128) NULL DEFAULT NULL AFTER `trx_type`,
	ADD INDEX `paysafeRef` (`paysafeRef`);
");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
