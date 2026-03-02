<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_epicpay_customersourcessubscriptions extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("CREATE TABLE `epicpay_customers` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`email` VARCHAR(255) NULL DEFAULT NULL,
	`first_name` VARCHAR(150) NULL DEFAULT NULL,
	`last_name` VARCHAR(150) NULL DEFAULT NULL,
	`church_id` INT(11) NULL DEFAULT NULL,
	`account_donor_id` INT(11) UNSIGNED NULL DEFAULT NULL,
	`epicpay_customer_id` VARCHAR(50) NULL DEFAULT NULL,
	`request_data` LONGTEXT NULL DEFAULT NULL,
	`request_response` LONGTEXT NULL DEFAULT NULL,
	`status` CHAR(1) NULL DEFAULT 'U',
	`migrated` CHAR(1) NULL DEFAULT NULL,
	`created_at` DATETIME NULL DEFAULT NULL,
	`updated_at` DATETIME NULL DEFAULT NULL,
	`from_stripemigration_sid` INT(10) UNSIGNED NULL DEFAULT NULL,
	`from_stripemigration_metadata` TEXT NULL DEFAULT NULL,
	`done_temp` TINYINT(3) UNSIGNED NULL DEFAULT NULL,
	`from_stripemigration_onetime` TINYINT(3) UNSIGNED NULL DEFAULT NULL,
	PRIMARY KEY (`id`),
	INDEX `idx_epc_email` (`email`),
	INDEX `idx_epc_account_donor_id` (`account_donor_id`),
	INDEX `idx_epc_epicpay_customer_id` (`epicpay_customer_id`),
	INDEX `idx_epc_church_id` (`church_id`),
	INDEX `idx_epc_created_at` (`created_at`),
	INDEX `idx_epc_updated_at` (`updated_at`)
)
ENGINE=InnoDB
;
");

        $this->db->query("CREATE TABLE `epicpay_customer_sources` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`customer_id` INT(10) UNSIGNED NULL DEFAULT NULL,
	`church_id` INT(11) UNSIGNED NULL DEFAULT NULL,
	`account_donor_id` INT(11) UNSIGNED NULL DEFAULT NULL,
	`source_type` VARCHAR(50) NULL DEFAULT NULL,
	`exp_month` CHAR(2) NULL DEFAULT NULL,
	`exp_year` CHAR(4) NULL DEFAULT NULL,
	`last_digits` CHAR(6) NULL DEFAULT NULL,
	`postal_code` VARCHAR(16) NULL DEFAULT NULL,
	`name_holder` VARCHAR(255) NULL DEFAULT NULL,
	`bank_name` VARCHAR(255) NULL DEFAULT NULL,
	`epicpay_wallet_id` VARCHAR(50) NULL DEFAULT NULL,
	`epicpay_customer_id` VARCHAR(50) NULL DEFAULT NULL,
	`is_active` CHAR(1) NULL DEFAULT 'Y',
	`is_saved` CHAR(1) NULL DEFAULT 'N',
	`request_data` LONGTEXT NULL DEFAULT NULL,
	`request_response` LONGTEXT NULL DEFAULT NULL,
	`request_data_update` LONGTEXT NULL DEFAULT NULL,
	`request_response_update` LONGTEXT NULL DEFAULT NULL,
	`status` CHAR(1) NULL DEFAULT 'U',
	`migrated` CHAR(1) NULL DEFAULT NULL,
	`created_at` DATETIME NULL DEFAULT NULL,
	`updated_at` DATETIME NULL DEFAULT NULL,
	`src` VARCHAR(50) NULL DEFAULT NULL,
	`template` VARCHAR(50) NULL DEFAULT NULL,
	`from_stripemigration_sid` INT(10) UNSIGNED NULL DEFAULT NULL,
	`done_temp` TINYINT(3) UNSIGNED NULL DEFAULT NULL,
	`from_stripemigration_onetime` INT(10) UNSIGNED NULL DEFAULT NULL,
	`ask_wallet_update` TINYINT(3) UNSIGNED NULL DEFAULT NULL,
	PRIMARY KEY (`id`),
	INDEX `idx_epcs_customer_id` (`customer_id`),
	INDEX `idx_epcs_ep_wallet_id` (`epicpay_wallet_id`),
	INDEX `idx_epcs_ep_customer_id` (`epicpay_customer_id`),
	INDEX `idx_epcs_church_id` (`church_id`),
	INDEX `idx_epcs_created_at` (`created_at`),
	INDEX `idx_epcs_updated_at` (`updated_at`)
)
ENGINE=InnoDB
;
");
        
        $this->db->query("CREATE TABLE `epicpay_customer_subscriptions` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`customer_id` INT(10) UNSIGNED NULL DEFAULT NULL,
	`customer_source_id` INT(10) UNSIGNED NULL DEFAULT NULL,
	`church_id` INT(11) UNSIGNED NULL DEFAULT NULL,
	`campus_id` INT(11) UNSIGNED NULL DEFAULT NULL,
	`account_donor_id` INT(11) UNSIGNED NULL DEFAULT NULL,
	`first_name` VARCHAR(128) NULL DEFAULT NULL,
	`last_name` VARCHAR(128) NULL DEFAULT NULL,
	`email` VARCHAR(128) NULL DEFAULT NULL,
	`zip` VARCHAR(50) NULL DEFAULT NULL,
	`giving_source` VARCHAR(50) NULL DEFAULT NULL,
	`giving_type` VARCHAR(50) NULL DEFAULT NULL,
	`tags` VARCHAR(100) NULL DEFAULT NULL,
	`frequency` VARCHAR(50) NULL DEFAULT NULL,
	`start_on` DATETIME NULL DEFAULT NULL,
	`multi_transaction_data` LONGTEXT NULL DEFAULT NULL,
	`multi_transaction_data_bkup` TEXT NULL DEFAULT NULL,
	`amount` DECIMAL(15,2) NULL DEFAULT NULL,
	`request_data` LONGTEXT NULL DEFAULT NULL,
	`request_response` LONGTEXT NULL DEFAULT NULL,
	`request_response_update` LONGTEXT NULL DEFAULT NULL,
	`epicpay_customer_id` VARCHAR(50) NULL DEFAULT NULL,
	`epicpay_wallet_id` VARCHAR(50) NULL DEFAULT NULL,
	`epicpay_subscription_id` VARCHAR(50) NULL DEFAULT NULL,
	`epicpay_template` VARCHAR(50) NULL DEFAULT NULL,
	`src` VARCHAR(50) NULL DEFAULT NULL,
	`is_fee_covered` TINYINT(4) NULL DEFAULT 0,
	`status` CHAR(1) NULL DEFAULT 'U',
	`migrated` CHAR(1) NULL DEFAULT NULL,
	`created_at` DATETIME NULL DEFAULT NULL,
	`updated_at` DATETIME NULL DEFAULT NULL,
	`cancelled_at` DATETIME NULL DEFAULT NULL,
	`from_stripemigration_sid` INT(10) UNSIGNED NULL DEFAULT NULL,
	`done_temp` TINYINT(4) NULL DEFAULT NULL,
	`campaign_id` INT(10) UNSIGNED NULL DEFAULT NULL,
	PRIMARY KEY (`id`),
	INDEX `idx_epsub_customer_id` (`customer_id`),
	INDEX `idx_epsub_source_id` (`customer_source_id`),
	INDEX `idx_epsub_epicpay_indexes` (`epicpay_customer_id`, `epicpay_wallet_id`, `epicpay_subscription_id`),
	INDEX `idx_epsub_church_id` (`church_id`),
	INDEX `idx_epsub_created_at` (`created_at`),
	INDEX `idx_epsub_updated_at` (`updated_at`),
	INDEX `idx_epsub_campus_id` (`campus_id`),
	INDEX `epicpay_template` (`epicpay_template`),
	INDEX `campaign_id` (`campaign_id`)
)
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
