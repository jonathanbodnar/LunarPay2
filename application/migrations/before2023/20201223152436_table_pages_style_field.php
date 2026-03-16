<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_table_pages_style_field extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("ALTER TABLE pages ADD `style` char(1) NULL COMMENT 'F Floating, T Two Columns';");
        
        echo "<p>Migration_table_pages_style_field</p>";
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
