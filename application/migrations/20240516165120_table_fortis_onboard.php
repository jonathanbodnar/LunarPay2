<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_table_fortis_onboard extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_table_fortis_onboard</p>");

        $this->db->query(""
                . "CREATE TABLE `church_onboard_fortis` (
					`id` INT(11) NOT NULL AUTO_INCREMENT,
					`church_id` INT(11) NULL DEFAULT NULL,
					`sign_first_name` VARCHAR(20) NULL DEFAULT NULL COMMENT 'Primary principal or signer\'s first name',
					`sign_last_name` VARCHAR(20) NULL DEFAULT NULL COMMENT 'Primary principal or signer\'s last name',
					`sign_phone_number` VARCHAR(20) NULL DEFAULT NULL COMMENT 'Primary principal or signer\'s phone number',
					`email` VARCHAR(128) NULL DEFAULT NULL,
					`merchant_address_line_1` VARCHAR(100) NULL DEFAULT NULL,
					`app_status` ENUM('BANK_INFORMATION_SENT','FORM_ERROR','ACTIVE') NULL DEFAULT NULL,
					`mpa_link` VARCHAR(512) NULL DEFAULT NULL,
					`processor_response` TEXT NULL DEFAULT NULL,
					`auth_user_id` VARCHAR(128) NULL DEFAULT NULL,
					`auth_user_api_key` VARCHAR(128) NULL DEFAULT NULL,
					`account_number_last4` VARCHAR(4) NULL DEFAULT NULL,
					`routing_number_last4` VARCHAR(4) NULL DEFAULT NULL,
					`account_holder_name` VARCHAR(40) NULL DEFAULT NULL,
					`account2_number_last4` VARCHAR(4) NULL DEFAULT NULL,
					`routing2_number_last4` VARCHAR(4) NULL DEFAULT NULL,
					`account2_holder_name` VARCHAR(40) NULL DEFAULT NULL,
					PRIMARY KEY (`id`),
					INDEX `church_id` (`church_id`)
				)
				COLLATE='utf8_general_ci'
				ENGINE=InnoDB
				;
				
"
                . "");

        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
    }

    public function down() {
        
    }

}
