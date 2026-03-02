<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_invoices_archived_status_documentation extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_invoices_archived_status_documentation</p>");

        $this->db->query("ALTER TABLE `invoices`
	CHANGE COLUMN `status` `status` CHAR(1) NULL DEFAULT 'D' COMMENT 'P = Paid, U = Unpaid/Open, D = Draft, E = Due, C = Canceled' AFTER `due_date`;
");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
