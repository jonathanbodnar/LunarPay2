<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_invoice_add_ach_fee extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_invoice_add_ach_fee</p>");

        $this->db->query("ALTER TABLE `invoices` ADD `fee_when_ach` DECIMAL(10,2) NOT NULL DEFAULT '0.00' AFTER `fee`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
