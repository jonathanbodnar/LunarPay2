<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_products_add_user_id_fiend extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_products_add_user_id_fiend</p>");

        $this->db->query("ALTER TABLE `products` ADD `user_id` int NULL");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
