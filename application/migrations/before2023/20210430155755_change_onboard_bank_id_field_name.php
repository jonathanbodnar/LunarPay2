<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_change_onboard_bank_id_field_name extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_change_onboard_bank_id_field_name</p>");

        $this->db->query("ALTER TABLE `church_onboard_paysafe`
	CHANGE COLUMN `ach_bank_id` `bank_id` VARCHAR(255) NULL DEFAULT NULL AFTER `business_owner_id2`,
	CHANGE COLUMN `ach_bank_id2` `bank_id2` VARCHAR(255) NULL DEFAULT NULL AFTER `bank_id`;
");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
