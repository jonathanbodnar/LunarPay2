<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_product_id_quickbooks extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_product_id_quickbooks</p>");

        $this->db->query("ALTER TABLE products ADD product_quickbooks_id VARCHAR(20) NULL DEFAULT NULL AFTER product_stripe_id;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
