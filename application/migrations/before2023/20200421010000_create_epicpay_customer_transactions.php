<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_create_epicpay_customer_transactions extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("CREATE TABLE `epicpay_customer_transactions` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`customer_id` INT(11) UNSIGNED NOT NULL,
	`customer_source_id` INT(11) UNSIGNED NOT NULL,
	`customer_subscription_id` INT(11) UNSIGNED NULL DEFAULT NULL,
	`church_id` INT(11) UNSIGNED NULL DEFAULT NULL,
	`campus_id` INT(11) UNSIGNED NULL DEFAULT NULL,
	`account_donor_id` INT(11) NULL DEFAULT NULL,
	`batch_id` INT(11) NULL DEFAULT NULL,
	`batch_method` VARCHAR(50) NULL DEFAULT NULL,
	`batch_committed` CHAR(1) NULL DEFAULT NULL,
	`batch_extra_data` LONGTEXT NULL DEFAULT NULL,
	`sub_total_amount` DECIMAL(15,2) NULL DEFAULT NULL,
	`total_amount` DECIMAL(15,2) NULL DEFAULT NULL,
	`fee` DECIMAL(15,2) NULL DEFAULT 0.00,
	`first_name` VARCHAR(100) NULL DEFAULT NULL,
	`last_name` VARCHAR(100) NULL DEFAULT NULL,
	`email` VARCHAR(100) NULL DEFAULT NULL,
	`phone` VARCHAR(50) NULL DEFAULT NULL,
	`address` VARCHAR(255) NULL DEFAULT NULL,
	`note` VARCHAR(255) NULL DEFAULT NULL,
	`country` VARCHAR(100) NULL DEFAULT NULL,
	`city` VARCHAR(100) NULL DEFAULT NULL,
	`apartment` VARCHAR(100) NULL DEFAULT NULL,
	`state` VARCHAR(100) NULL DEFAULT NULL,
	`zip` VARCHAR(100) NULL DEFAULT NULL,
	`kiosk` VARCHAR(100) NULL DEFAULT NULL,
	`member_id` VARCHAR(100) NULL DEFAULT NULL,
	`giving_source` VARCHAR(50) NULL DEFAULT NULL,
	`event_data` LONGTEXT NULL DEFAULT NULL,
	`giving_type` VARCHAR(50) NULL DEFAULT NULL,
	`tags` VARCHAR(100) NULL DEFAULT NULL,
	`multi_transaction_data` LONGTEXT NULL DEFAULT NULL,
	`multi_transaction_data_bkup` LONGTEXT NULL DEFAULT NULL,
	`request_data` LONGTEXT NULL DEFAULT NULL,
	`request_response` LONGTEXT NULL DEFAULT NULL,
	`created_from` CHAR(1) NULL DEFAULT 'D' COMMENT 'D -> Default | M -> Manual download from epicpay (recurrent_payment, not triggered by the callback)',
	`epicpay_customer_id` VARCHAR(50) NULL DEFAULT NULL,
	`epicpay_wallet_id` VARCHAR(50) NULL DEFAULT NULL,
	`epicpay_transaction_type` VARCHAR(15) NULL DEFAULT NULL,
	`epicpay_transaction_id` VARCHAR(50) NULL DEFAULT NULL,
	`status` CHAR(1) NULL DEFAULT 'U',
	`status_ach` CHAR(1) NULL DEFAULT NULL COMMENT 'W : Waiting for confirmation | P : Proccessed | N : Rejected',
	`ach_reject_response` LONGTEXT NULL DEFAULT NULL,
	`migrated` CHAR(1) NULL DEFAULT NULL,
	`migration_tr_id` VARCHAR(100) NULL DEFAULT NULL,
	`created_at` DATETIME NULL DEFAULT NULL,
	`updated_at` DATETIME NULL DEFAULT NULL,
	`cancelled_at` DATETIME NULL DEFAULT NULL,
	`src` VARCHAR(50) NULL DEFAULT NULL,
	`template` VARCHAR(50) NULL DEFAULT NULL,
	`is_fee_covered` TINYINT(4) NOT NULL DEFAULT 0,
	`from_domain` VARCHAR(64) NULL DEFAULT NULL,
	`donor_ip` VARCHAR(45) NULL DEFAULT NULL,
	`stripe_id` INT(10) UNSIGNED NULL DEFAULT NULL,
	`notfished_on_whook` TINYINT(4) NULL DEFAULT NULL,
	`amount_upd` DECIMAL(10,2) NULL DEFAULT NULL,
	`campaign_id` INT(10) UNSIGNED NULL DEFAULT NULL,
	PRIMARY KEY (`id`),
	INDEX `idx_epct_customer_id` (`customer_id`, `customer_source_id`),
	INDEX `idx_epct_epicpay_transaction_id` (`epicpay_transaction_id`),
	INDEX `idx_epct_church_id` (`church_id`),
	INDEX `idx_epct_batch_id` (`batch_id`),
	INDEX `idx_epct_created_at` (`created_at`),
	INDEX `idx_epct_updated_at` (`updated_at`),
	INDEX `campaign_id` (`campaign_id`)
)
ENGINE=InnoDB
;
");

        printd(get_class($this) . '<br>');
    }

    public function down() {
        
    }

}
