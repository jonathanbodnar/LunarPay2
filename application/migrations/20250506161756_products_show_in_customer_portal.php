<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_products_show_in_customer_portal extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_products_show_in_customer_portal</p>");

        $this->db->query("ALTER TABLE `products` ADD `show_customer_portal` TINYINT(4) NULL AFTER `file_hash`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
