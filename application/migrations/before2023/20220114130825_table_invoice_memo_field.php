<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_table_invoice_memo_field extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_table_invoice_memo_field</p>");

        $this->db->query("ALTER TABLE invoices ADD memo varchar(500) NULL AFTER payment_options;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
