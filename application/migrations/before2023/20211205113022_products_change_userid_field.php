<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_products_change_userid_field extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_products_change_userid_field</p>");

        $this->db->query("ALTER TABLE `products` CHANGE `user_id` `client_id` int NULL AFTER `slug`;");
        $this->db->query(" ALTER TABLE `products` DROP `qty`;");
        

       
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
