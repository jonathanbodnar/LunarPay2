<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_subs_last_trxn extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_subs_last_trxn</p>");

        $this->db->query("ALTER TABLE `epicpay_customer_subscriptions` ADD `last_transaction_id` INT UNSIGNED NULL AFTER `created_as_trial`;");
      
        
    }

    public function down() {
        
    }

}
