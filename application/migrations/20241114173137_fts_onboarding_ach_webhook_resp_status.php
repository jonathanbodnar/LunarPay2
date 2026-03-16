<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_fts_onboarding_ach_webhook_resp_status extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_fts_onboarding_ach_webhook_resp_status</p>");

        $this->db->query("ALTER TABLE `church_onboard_fortis` ADD `ach_webhook_resp_status` TEXT NULL DEFAULT NULL AFTER `ach_product_transaction_id`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
