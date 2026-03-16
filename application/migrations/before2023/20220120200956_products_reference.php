<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_products_reference extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_products_reference</p>");

        $this->db->query("ALTER TABLE `products`
	ADD COLUMN `reference` VARCHAR(32) NULL DEFAULT NULL AFTER `id`,
	ADD INDEX `reference` (`reference`);
");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
