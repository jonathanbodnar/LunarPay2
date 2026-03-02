<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_invoices_total_amount extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_invoices_total_amount</p>");

        $this->db->query("ALTER TABLE `invoices`
	ADD COLUMN `total_amount` DECIMAL(10,2) NULL DEFAULT NULL AFTER `donor_id`;
");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
