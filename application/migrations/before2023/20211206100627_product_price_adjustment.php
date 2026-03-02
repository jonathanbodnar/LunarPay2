<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_product_price_adjustment extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_product_price_adjustment</p>");

        $this->db->query("ALTER TABLE `products`
	CHANGE COLUMN `price` `price` DECIMAL(10,2) NULL DEFAULT NULL AFTER `name`;
");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
