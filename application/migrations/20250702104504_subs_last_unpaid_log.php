<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_subs_last_unpaid_log extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_subs_last_unpaid_log</p>");

        $this->db->query("ALTER TABLE `epicpay_customer_subscriptions` ADD `last_unpaid_log_at` DATETIME NULL AFTER `webhook_sent_log`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
