<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_invoice_stripe_tags  extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_invoice_stripe_tags </p>");

        $this->db->query("ALTER TABLE `invoices` ADD `tags` VARCHAR(1024) NULL AFTER `stripe_id`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
