<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_invoice_update_stripe_id extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_invoce_update_stripe_id</p>");

        $this->db->query("ALTER TABLE `invoices` CHANGE `stripe_id` `stripe_id` VARCHAR(40) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
