<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_table_invoices_due_date extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_table_invoices_due_date</p>");

        $this->db->query("ALTER TABLE invoices ADD due_date datetime NULL AFTER total_amount;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
