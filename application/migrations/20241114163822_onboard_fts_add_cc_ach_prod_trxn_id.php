<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_onboard_fts_add_cc_ach_prod_trxn_id extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_onboard_fts_add_cc_ach_prod_trxn_id</p>");

        $this->db->query("ALTER TABLE `church_onboard_fortis` ADD `cc_product_transaction_id` VARCHAR(64) NULL DEFAULT NULL AFTER `location_id`;");

        $this->db->query("ALTER TABLE `church_onboard_fortis` ADD `ach_product_transaction_id` VARCHAR(64) NULL DEFAULT NULL AFTER `cc_product_transaction_id`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
