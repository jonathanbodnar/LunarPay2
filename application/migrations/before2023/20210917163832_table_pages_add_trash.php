<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_table_pages_add_trash extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_table_pages_add_trash</p>");

        $this->db->query("ALTER TABLE pages ADD trash tinyint(1) DEFAULT 0 NULL;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
