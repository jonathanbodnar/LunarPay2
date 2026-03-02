<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_invoice_stripe_id extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_invoice_stripe_id</p>");

        $this->db->query("ALTER TABLE `invoices` ADD `stripe_id` VARCHAR(20) NULL AFTER `donor_id`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
