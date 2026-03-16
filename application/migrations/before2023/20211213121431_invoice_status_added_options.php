<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_invoice_status_added_options extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_invoice_status_added_options</p>");

        $this->db->query("ALTER TABLE `invoices`
	CHANGE COLUMN `status` `status` CHAR(1) NULL DEFAULT 'D' COMMENT 'P = Paid, U = Unpaid, D = Draft' AFTER `total_amount`;
");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
