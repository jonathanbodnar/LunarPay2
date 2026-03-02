<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_invoice_fee_amex extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_invoice_fee_amex</p>");

        $this->db->query("ALTER TABLE `invoices` ADD `fee_when_amex` DECIMAL(10,2) NOT NULL DEFAULT '0' COMMENT 'fee when amex card ' AFTER `fee`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
