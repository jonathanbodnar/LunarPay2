<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_table_invoice_footer_field extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_table_invoice_footer_field</p>");

        $this->db->query("ALTER TABLE invoices ADD footer varchar(500) NULL AFTER memo;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
