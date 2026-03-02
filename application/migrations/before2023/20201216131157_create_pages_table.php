<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_create_pages_table extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("CREATE TABLE pages (
            id int auto_increment NOT NULL,
            church_id int NULL,
            campus_id int NULL,
            client_id int NULL,
            page_name varchar(200) NULL,
            slug varchar(200) NULL,
            title varchar(200) NULL,
            content varchar(1000) NULL,
            background_image varchar(200) NULL,
            created_at DATETIME NULL,
            CONSTRAINT page_pk PRIMARY KEY (id)
        );");
        $this->db->query("CREATE INDEX page_id_IDX USING BTREE ON pages (id);");
        $this->db->query("CREATE INDEX page_church_id_IDX USING BTREE ON pages (church_id);");
        $this->db->query("CREATE INDEX page_campus_id_IDX USING BTREE ON pages (campus_id);");
        
        echo "<p>Migration_create_page_table</p>";
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
