<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_table_invoice_products_product_name_field extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_table_invoice_products_product_name_field</p>");

        $this->db->query("ALTER TABLE invoice_products ADD product_name varchar(255) NULL AFTER product_id;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
