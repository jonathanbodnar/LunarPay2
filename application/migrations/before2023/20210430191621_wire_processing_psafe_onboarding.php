<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_wire_processing_psafe_onboarding extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_wire_processing_psafe_onboarding</p>");

        $this->db->query("ALTER TABLE `church_onboard_paysafe`
	ADD COLUMN `account_id6` VARCHAR(255) NULL DEFAULT NULL COMMENT 'WIRE Processing' AFTER `account_id5`,
	ADD INDEX `account_id6` (`account_id6`);
");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
