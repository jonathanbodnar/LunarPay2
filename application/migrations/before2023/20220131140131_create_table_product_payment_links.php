<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_create_table_product_payment_links extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_create_table_product_payment_links</p>");

        $this->db->query("CREATE TABLE `payment_link_products` (
            `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
            `payment_link_id` int NOT NULL,
            `product_id` int NOT NULL,
            `is_editable` tinyint NOT NULL DEFAULT '0',
            `qty` int NOT NULL,
            INDEX `payment_link_products_idx` (`id`, `payment_link_id`,`product_id`)
            ) ENGINE='InnoDB' COLLATE 'utf8_general_ci';
        ");
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
    }

    public function down() {
        
    }

}
