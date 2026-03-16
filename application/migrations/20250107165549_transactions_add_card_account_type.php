<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_transactions_add_card_account_type extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_transactions_add_card_account_type</p>");

        $this->db->query("ALTER TABLE `epicpay_customer_transactions` ADD `src_account_type` VARCHAR(16) NULL DEFAULT NULL AFTER `created_from`;");

        $this->db->query("ALTER TABLE `epicpay_customer_sources` ADD `src_account_type` VARCHAR(16) NULL DEFAULT NULL AFTER `last_digits`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
