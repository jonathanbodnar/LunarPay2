<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_table_invoices_payment_options extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_table_invoices_payment_options</p>");

        $this->db->query("ALTER TABLE invoices ADD payment_options varchar(255) NULL;");
        $this->db->query("ALTER TABLE invoices CHANGE payment_options payment_options varchar(255) NULL COMMENT 'JSON Object: BANK = Bank, CC = Credit Card' AFTER donor_id;");

        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
