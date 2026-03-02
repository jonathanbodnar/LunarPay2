<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_payment_links_add_index extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_payment_links_add_index</p>");

        $this->db->query("ALTER TABLE `payment_link_products` ADD INDEX `product_id` (`product_id`);");
        $this->db->query("ALTER TABLE `payment_link_products` ADD INDEX `payment_link_id` (`payment_link_id`);");
        $this->db->query("ALTER TABLE `payment_link_products` CHANGE `product_price` `product_price` decimal(10,2) NOT NULL AFTER `product_name`;");
        $this->db->query("ALTER TABLE `payment_links` DROP `trash`;");
        

        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
