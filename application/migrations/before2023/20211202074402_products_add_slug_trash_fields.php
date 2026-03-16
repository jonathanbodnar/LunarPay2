<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_products_add_slug_trash_fields extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_products_add_slug_trash_fields</p>");

        $this->db->query("ALTER TABLE `products` ADD `trash` tinyint NULL DEFAULT 0");
        $this->db->query("ALTER TABLE `products` ADD `slug` varchar(200) DEFAULT NULL");

       
        
        printd('<p><b>fields added correctly</b></p>');
        
    }

    public function down() {
        
    }

}
