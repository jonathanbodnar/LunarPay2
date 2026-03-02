<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_table_products_change_file_hash extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_table_products_change_file_hash</p>");

        $this->db->query("ALTER TABLE products CHANGE digital_content file_hash varchar(255)  
                NULL COMMENT 'file hash is a section of the url of the file linked to the product, it''s a long hash for security purposes';");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
