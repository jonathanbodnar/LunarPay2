<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_payment_link_remove_product_id extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_payment_link_remove_product_id</p>");

        $this->db->query("ALTER TABLE `payment_links`
        DROP `product_id`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
