<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_onboard_add_account_types extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_onboard_add_account_types</p>");

        $this->db->query("ALTER TABLE `church_onboard_paysafe`
	CHANGE COLUMN `account_id` `account_id` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Credit Card Processing' AFTER `merchant_id`,
	CHANGE COLUMN `account_id2` `account_id2` VARCHAR(255) NULL DEFAULT NULL COMMENT 'ACH Processing' AFTER `account_id`,
	ADD COLUMN `account_id3` VARCHAR(255) NULL DEFAULT NULL COMMENT 'EFT Processing' AFTER `account_id2`,
	ADD COLUMN `account_id4` VARCHAR(255) NULL DEFAULT NULL COMMENT 'SEPA Processing' AFTER `account_id3`,
	ADD COLUMN `account_id5` VARCHAR(255) NULL DEFAULT NULL COMMENT 'BACS Processing' AFTER `account_id4`,
	ADD INDEX `account_id3` (`account_id3`),
	ADD INDEX `account_id4` (`account_id4`),
	ADD INDEX `account_id5` (`account_id5`);
");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
