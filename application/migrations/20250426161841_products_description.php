<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_products_description extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_products_description</p>");

        $this->db->query("ALTER TABLE `products` ADD `description` TEXT NULL DEFAULT NULL AFTER `name`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
