<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_subs_rename_traxn_count extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_subs_rename_traxn_count</p>");

        $this->db->query("ALTER TABLE `epicpay_customer_subscriptions` CHANGE `paysafe_success_trxns` `success_trxns` INT(10) UNSIGNED NULL DEFAULT NULL;");

        $this->db->query("ALTER TABLE `epicpay_customer_subscriptions` CHANGE `paysafe_fail_trxns` `fail_trxns` INT(10) UNSIGNED NULL DEFAULT NULL;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
