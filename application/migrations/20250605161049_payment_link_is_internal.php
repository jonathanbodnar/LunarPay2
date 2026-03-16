<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_payment_link_is_internal extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_payment_link_is_internal</p>");

        $this->db->query("ALTER TABLE `payment_links` ADD `is_internal` TINYINT NULL DEFAULT NULL COMMENT 'Indicates if the payment link is for internal system use (not exposed to customers), it is used for creating subscriptions from the dashboard' AFTER `status`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
