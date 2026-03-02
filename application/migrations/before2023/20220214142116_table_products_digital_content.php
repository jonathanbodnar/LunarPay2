<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_table_products_digital_content extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_table_products_digital_content</p>");

        $this->db->query("ALTER TABLE products ADD digital_content varchar(255) NULL;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
