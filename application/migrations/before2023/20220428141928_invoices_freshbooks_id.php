<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_invoices_freshbooks_id extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_invoices_freshbooks_id</p>");

        $this->db->query("ALTER TABLE `invoices` ADD `freshbooks_id` VARCHAR(40) NULL DEFAULT NULL AFTER `stripe_id`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
