<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_products_add_user_id_and_email extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_products_add_user_id_and_email</p>");

        $this->db->query("ALTER TABLE `payment_links` ADD `customer_id` INT NULL DEFAULT NULL AFTER `campus_id`, ADD `customer_email` VARCHAR(128) NULL DEFAULT NULL AFTER `customer_id`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
