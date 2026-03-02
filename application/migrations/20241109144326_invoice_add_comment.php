<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_invoice_add_comment extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_invoices_add_comment</p>");

        $this->db->query("ALTER TABLE `invoices` CHANGE `fee` `fee` DECIMAL(10,2) NOT NULL DEFAULT '0.00' COMMENT 'fee when credit card';");
        $this->db->query("ALTER TABLE `invoices` CHANGE `fee_when_ach` `fee_when_ach` DECIMAL(10,2) NOT NULL DEFAULT '0.00' COMMENT 'fee when ach';");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
