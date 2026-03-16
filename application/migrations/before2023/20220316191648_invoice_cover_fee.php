<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_invoice_cover_fee extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_invoice_cover_fee</p>");

        $this->db->query("ALTER TABLE `invoices`
	ADD COLUMN `cover_fee` TINYINT NULL DEFAULT NULL AFTER `status`;
");
        
        $this->db->query("ALTER TABLE `invoices`
	ADD COLUMN `fee` DECIMAL(10,2) NOT NULL DEFAULT '0' AFTER `total_amount`;
");        
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
