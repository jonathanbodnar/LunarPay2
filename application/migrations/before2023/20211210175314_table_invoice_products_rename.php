<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_table_invoice_products_rename extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_table_invoice_products_rename</p>");

        $this->db->query("RENAME TABLE invoice_details TO invoice_products;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
