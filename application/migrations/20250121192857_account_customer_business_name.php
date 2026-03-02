<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_account_customer_business_name extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_account_customer_business_name</p>");

        $this->db->query("ALTER TABLE `account_donor` ADD `business_name` VARCHAR(128) NULL DEFAULT NULL AFTER `city`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
