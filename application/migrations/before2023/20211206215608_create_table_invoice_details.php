<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_create_table_invoice_details extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("");

        $this->db->query("CREATE TABLE invoice_details (
                        id int auto_increment NOT NULL,
                        invoice_id int NULL,
                        product_id int NULL,
                        price decimal(10,2) NULL,
                        quantity int NULL,
                        CONSTRAINT invoice_details_pk PRIMARY KEY (id)
                    );");
        $this->db->query("CREATE INDEX invoice_details_invoice_id_IDX USING BTREE ON invoice_details (invoice_id);");
        $this->db->query("CREATE INDEX invoice_details_product_id_IDX USING BTREE ON invoice_details (product_id);");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
