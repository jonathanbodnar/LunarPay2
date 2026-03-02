<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_table_pages_font_styles extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_table_pages_font_styles</p>");

        $this->db->query("ALTER TABLE pages ADD title_font_family varchar(100) DEFAULT 'Segoe UI' NULL;");
        $this->db->query("ALTER TABLE pages ADD title_font_family_type varchar(100) DEFAULT 'default' NULL;");
        $this->db->query("ALTER TABLE pages ADD content_font_family varchar(100) DEFAULT 'Segoe UI' NULL;");
        $this->db->query("ALTER TABLE pages ADD content_font_family_type varchar(100) DEFAULT 'default' NULL;");
        $this->db->query("ALTER TABLE pages ADD title_font_size DECIMAL(10,2) DEFAULT 3.5 NULL;");
        $this->db->query("ALTER TABLE pages ADD content_font_size DECIMAL(10,2) DEFAULT 2 NULL;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
