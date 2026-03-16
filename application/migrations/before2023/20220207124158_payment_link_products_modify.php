<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_payment_link_products_modify extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_payment_link_products_modify</p>");

        $this->db->query("ALTER TABLE `payment_link_products`
        ADD `product_name` varchar(200) COLLATE 'utf8_general_ci' NOT NULL AFTER `product_id`,
        ADD `product_price` decimal NOT NULL AFTER `product_name`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
