<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_table_invoices_post_purchase_link extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_table_invoices_post_purchase_link</p>");

        $this->db->query("ALTER TABLE invoices ADD show_post_purchase_link tinyint(4) NULL;");
        $this->db->query("ALTER TABLE invoices ADD post_purchase_link varchar(255) NULL;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
