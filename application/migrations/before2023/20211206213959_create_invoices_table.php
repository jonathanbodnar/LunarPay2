<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_create_invoices_table extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_create_invoices_table</p>");

        $this->db->query("CREATE TABLE invoices (
                            id int auto_increment NOT NULL,
                            church_id int NULL,
                            campus_id int NULL,
                            donor_id int NULL,
                            created_at datetime NULL,
                            CONSTRAINT invoices_pk PRIMARY KEY (id)
                        );");
        $this->db->query("CREATE INDEX invoices_church_id_IDX USING BTREE ON invoices (church_id);");
        $this->db->query("CREATE INDEX invoices_campus_id_IDX USING BTREE ON invoices (campus_id);");
        $this->db->query("CREATE INDEX invoices_donor_id_IDX USING BTREE ON invoices (donor_id);");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
