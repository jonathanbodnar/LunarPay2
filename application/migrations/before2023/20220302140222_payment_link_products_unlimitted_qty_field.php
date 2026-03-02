<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_payment_link_products_unlimitted_qty_field extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_payment_link_products_unlimitted_qty_field</p>");

        $this->db->query("ALTER TABLE `payment_link_products`
	ADD COLUMN `is_qty_unlimited` TINYINT NOT NULL DEFAULT '0' AFTER `qty`;
");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
