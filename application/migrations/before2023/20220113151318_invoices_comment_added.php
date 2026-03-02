<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_invoices_comment_added extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_invoices_comment_added</p>");

        $this->db->query("ALTER TABLE `invoices`
	CHANGE COLUMN `status` `status` CHAR(1) NULL DEFAULT 'D' COMMENT 'P = Paid, U = Unpaid/Open, D = Draft' AFTER `total_amount`;
");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
