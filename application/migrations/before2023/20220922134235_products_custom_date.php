<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_products_custom_date extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_products_custom_date</p>");

        $this->db->query("ALTER TABLE `products` ADD `custom_date` TEXT  DEFAULT NULL AFTER `billing_period`");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
