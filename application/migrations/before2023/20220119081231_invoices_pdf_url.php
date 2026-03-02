<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_invoices_pdf_url extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_invoices_pdf_url</p>");

        $this->db->query("ALTER TABLE `invoices`
	ADD COLUMN `pdf_url` VARCHAR(255) NULL DEFAULT NULL AFTER `finalized`;
");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
