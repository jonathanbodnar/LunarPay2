<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_church_onboard extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("CREATE TABLE `church_onboard` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`church_id` INT(11) NULL DEFAULT NULL,
	`processor` VARCHAR(24) NULL DEFAULT NULL,
	`business_category` VARCHAR(64) NULL DEFAULT NULL,
	`business_type` VARCHAR(64) NULL DEFAULT NULL,
	`business_description` VARCHAR(200) NULL DEFAULT NULL,
	`ownership_type` VARCHAR(16) NULL DEFAULT NULL,
	`swiped_percent` VARCHAR(3) NULL DEFAULT NULL,
	`keyed_percent` VARCHAR(3) NULL DEFAULT NULL,
	`ecommerce_percent` VARCHAR(3) NULL DEFAULT NULL,
	`cc_monthly_volume_range` VARCHAR(3) NULL DEFAULT NULL,
	`cc_avg_ticket_range` VARCHAR(3) NULL DEFAULT NULL,
	`cc_high_ticket` INT(10) UNSIGNED NULL DEFAULT NULL,
	`ec_monthly_volume_range` VARCHAR(3) NULL DEFAULT NULL,
	`ec_avg_ticket_range` VARCHAR(3) NULL DEFAULT NULL,
	`ec_high_ticket` INT(10) UNSIGNED NULL DEFAULT NULL,
	`sign_first_name` VARCHAR(20) NULL DEFAULT NULL COMMENT 'Primary principal or signer\'s first name',
	`sign_last_name` VARCHAR(20) NULL DEFAULT NULL COMMENT 'Primary principal or signer\'s last name',
	`sign_phone_number` VARCHAR(20) NULL DEFAULT NULL COMMENT 'Primary principal or signer\'s phone number',
	`sign_ssn` VARCHAR(4) NULL DEFAULT NULL COMMENT 'Primary principal or signer\'s last 4 SSN',
	`sign_title` VARCHAR(20) NULL DEFAULT NULL COMMENT 'Primary principal or signer\'s title',
	`sign_state_province` VARCHAR(20) NULL DEFAULT NULL COMMENT 'Primary principal or signer\'s state-province',
	`sign_city` VARCHAR(20) NULL DEFAULT NULL COMMENT 'Primary principal or signer\'s city',
	`sign_postal_code` VARCHAR(10) NULL DEFAULT NULL COMMENT 'Primary principal or signer\'s postal-code',
	`routing_number_last4` VARCHAR(4) NULL DEFAULT NULL,
	`account_number_last4` VARCHAR(4) NULL DEFAULT NULL,
	`account_holder_name` VARCHAR(40) NULL DEFAULT NULL,
	PRIMARY KEY (`id`),
	INDEX `church_id` (`church_id`)
)
COLLATE='utf8_general_ci'
ENGINE=InnoDB
;
");

        printd(get_class($this));

        //$this->db->query('');        
        //printd('<b>comment when adding data</b>');
    }

    public function down() {
        
    }

}
