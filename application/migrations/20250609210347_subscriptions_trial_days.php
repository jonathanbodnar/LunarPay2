<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_subscriptions_trial_days extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_subscriptions_trial_days</p>");

        $this->db->query("ALTER TABLE `epicpay_customer_subscriptions` ADD `trial_days` INT UNSIGNED NULL DEFAULT NULL AFTER `is_fee_covered`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
