<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_payment_link_products_drop_unused_indexes extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_payment_link_products_drop_unused_indexes</p>");

        $this->db->query("ALTER TABLE `payment_link_products`
	DROP INDEX `payment_link_products_idx`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
