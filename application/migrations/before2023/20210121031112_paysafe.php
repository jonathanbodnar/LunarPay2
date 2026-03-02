<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_paysafe extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("ALTER TABLE `users`
	ADD COLUMN `payment_processor` VARCHAR(3) NULL DEFAULT 'EPP' COMMENT 'EPP: Epicpay, PSF: Paysafe' AFTER `permissions`;
");

        $this->db->query("CREATE TABLE `paysafe_webhooks` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`event_json` TEXT NULL DEFAULT NULL,
	`option` VARCHAR(32) NULL DEFAULT NULL,
	`created_at` DATETIME NULL DEFAULT NULL,
	PRIMARY KEY (`id`),
	INDEX `idx_epw_created_at` (`created_at`)
)
ENGINE=InnoDB
;
");

        $this->db->query("CREATE TABLE `church_onboard_paysafe` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`church_id` INT(11) UNSIGNED NOT NULL,
	`merchant_name` VARCHAR(100) NULL DEFAULT NULL,
	`merchant_id` VARCHAR(255) NULL DEFAULT NULL,
	`account_id` VARCHAR(255) NULL DEFAULT NULL,
	`account_id2` VARCHAR(255) NULL DEFAULT NULL,
	`business_owner_id` VARCHAR(255) NULL DEFAULT NULL,
	`business_owner_id2` VARCHAR(255) NULL DEFAULT NULL,
	`ach_bank_id` VARCHAR(255) NULL DEFAULT NULL,
	`ach_bank_id2` VARCHAR(255) NULL DEFAULT NULL,
	`terms_conditions_1` MEDIUMTEXT NULL DEFAULT NULL,
	`terms_conditions_1_ver` VARCHAR(12) NULL DEFAULT NULL,
	`terms_conditions_2` MEDIUMTEXT NULL DEFAULT NULL,
	`terms_conditions_2_ver` VARCHAR(12) NULL DEFAULT NULL,
	`terms_conditions_acceptance_id` VARCHAR(255) NULL DEFAULT NULL,
	`terms_conditions_acceptance_id2` VARCHAR(255) NULL DEFAULT NULL,
	`terms_conditions_meta` TEXT NULL DEFAULT NULL,
	`terms_conditions_meta2` TEXT NULL DEFAULT NULL,
	`bank_microdeposit_id` VARCHAR(50) NULL DEFAULT NULL,
	`bank_microdeposit_id2` VARCHAR(50) NULL DEFAULT NULL,
	`validation_amount` VARCHAR(4) NULL DEFAULT NULL,
	`bank_status` VARCHAR(50) NULL DEFAULT NULL,
	`bank_status_blocked` TEXT NULL DEFAULT NULL,
	`bank_status2` VARCHAR(50) NULL DEFAULT NULL,
	`bank_status2_blocked` TEXT NULL DEFAULT NULL,
	`bank_status_meta` TEXT NULL DEFAULT NULL,
	`bank_status2_meta` TEXT NULL DEFAULT NULL,
	`user` TEXT NULL DEFAULT NULL,
	`user2` TEXT NULL DEFAULT NULL,
	`activation_request_response` TEXT NULL DEFAULT NULL,
	`activation_request_response2` TEXT NULL DEFAULT NULL,
	`status_reason` VARCHAR(50) NULL DEFAULT NULL,
	`status_reason2` VARCHAR(50) NULL DEFAULT NULL,
	`account_status` VARCHAR(50) NULL DEFAULT NULL,
	`account_status2` VARCHAR(50) NULL DEFAULT NULL,
	`merchant_requests` TEXT NULL DEFAULT NULL,
	`merchant_responses` MEDIUMTEXT NULL DEFAULT NULL,
	`region` VARCHAR(2) NULL DEFAULT NULL COMMENT 'US CA EU',
	`business_category` VARCHAR(32) NULL DEFAULT NULL,
	`yearly_volume_range` VARCHAR(16) NULL DEFAULT NULL COMMENT 'LOW MEDIUM HIGH VERY_HIGH',
	`average_transaction_amount` INT(10) UNSIGNED NULL DEFAULT NULL,
	`dynamic_descriptor` VARCHAR(32) NULL DEFAULT NULL COMMENT 'max length 32',
	`phone_descriptor` VARCHAR(13) NULL DEFAULT NULL COMMENT 'max length 13',
	`business_type` VARCHAR(32) NULL DEFAULT NULL,
	`federal_tax_number` VARCHAR(32) NULL DEFAULT NULL COMMENT 'max length 30 (EU)',
	`registration_number` VARCHAR(32) NULL DEFAULT NULL COMMENT 'max length 20 (EU ONLY)',
	`trading_country` VARCHAR(2) NULL DEFAULT NULL,
	`trading_state` VARCHAR(2) NULL DEFAULT NULL,
	`trading_city` VARCHAR(50) NULL DEFAULT NULL,
	`trading_address_line_1` VARCHAR(512) NULL DEFAULT NULL,
	`trading_address_line_2` VARCHAR(512) NULL DEFAULT NULL,
	`trading_zip` VARCHAR(16) NULL DEFAULT NULL,
	`owner_first_name` VARCHAR(128) NULL DEFAULT NULL,
	`owner_last_name` VARCHAR(128) NULL DEFAULT NULL,
	`owner_title` VARCHAR(128) NULL DEFAULT NULL,
	`owner_phone` VARCHAR(64) NULL DEFAULT NULL,
	`owner_is_european` CHAR(3) NULL DEFAULT NULL,
	`owner_nationality` VARCHAR(2) NULL DEFAULT NULL,
	`owner_birth` DATE NULL DEFAULT NULL,
	`owner_ssn` VARCHAR(10) NULL DEFAULT NULL,
	`owner_current_country` VARCHAR(2) NULL DEFAULT NULL,
	`owner_current_state` VARCHAR(2) NULL DEFAULT NULL,
	`owner_current_city` VARCHAR(50) NULL DEFAULT NULL,
	`owner_current_zip` VARCHAR(16) NULL DEFAULT NULL,
	`owner_current_address_line_1` VARCHAR(512) NULL DEFAULT NULL,
	`owner_current_address_line_2` VARCHAR(512) NULL DEFAULT NULL,
	`years_at_address` VARCHAR(2) NULL DEFAULT NULL,
	`owner_previous_country` VARCHAR(2) NULL DEFAULT NULL,
	`owner_previous_state` VARCHAR(2) NULL DEFAULT NULL,
	`owner_previous_city` VARCHAR(50) NULL DEFAULT NULL,
	`owner_previous_zip` VARCHAR(16) NULL DEFAULT NULL,
	`owner_previous_address_line_1` VARCHAR(512) NULL DEFAULT NULL,
	`owner_previous_address_line_2` VARCHAR(512) NULL DEFAULT NULL,
	`euidcard_number` VARCHAR(30) NULL DEFAULT NULL,
	`euidcard_country_of_issue` VARCHAR(2) NULL DEFAULT NULL,
	`euidcard_expiry_date` DATE NULL DEFAULT NULL,
	`euidcard_number_line_1` VARCHAR(30) NULL DEFAULT NULL,
	`euidcard_number_line_2` VARCHAR(30) NULL DEFAULT NULL,
	`euidcard_number_line_3` VARCHAR(30) NULL DEFAULT NULL,
	`routing_number_last4` VARCHAR(4) NULL DEFAULT NULL,
	`account_number_last4` VARCHAR(4) NULL DEFAULT NULL,
	`backoffice_username` VARCHAR(100) NULL DEFAULT NULL,
	`backoffice_email` VARCHAR(255) NULL DEFAULT NULL,
	`backoffice_hash` VARCHAR(500) NULL DEFAULT NULL,
	`backoffice_recovery_question` TEXT NULL DEFAULT NULL,
	PRIMARY KEY (`id`),
	INDEX `church_id` (`church_id`),
	INDEX `paysafe_merchant_id` (`merchant_id`),
	INDEX `account_id` (`account_id`),
	INDEX `account_id2` (`account_id2`)
)
COLLATE='utf8_general_ci'
ENGINE=InnoDB
;");



        echo "<p>Migration_paysafe</p>";

        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
    }

    public function down() {
        
    }

}
