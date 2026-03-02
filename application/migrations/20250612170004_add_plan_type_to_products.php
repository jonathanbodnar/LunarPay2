<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_add_plan_type_to_products extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_add_plan_type_to_products</p>");

        $this->db->query("ALTER TABLE `products` ADD `plan_type` VARCHAR(50) NULL DEFAULT NULL AFTER `show_customer_portal`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

} 