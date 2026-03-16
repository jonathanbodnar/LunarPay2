<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_create_account_donor extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("CREATE TABLE `account_donor` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`email` VARCHAR(150) NULL DEFAULT '',
	`id_church` INT(11) NULL DEFAULT NULL,
	`address` LONGTEXT NULL DEFAULT NULL,
	`bank` LONGTEXT NULL DEFAULT NULL,
	`phone` LONGTEXT NULL DEFAULT NULL,
	`phone_bckp` LONGTEXT NULL DEFAULT NULL,
	`contact_phone` LONGTEXT NULL DEFAULT NULL,
	`contact_email` LONGTEXT NULL DEFAULT NULL,
	`address2` LONGTEXT NULL DEFAULT NULL,
	`city` LONGTEXT NULL DEFAULT NULL,
	`state` VARCHAR(45) NULL DEFAULT NULL,
	`postal_code` VARCHAR(45) NULL DEFAULT NULL,
	`campus_id` INT(11) NULL DEFAULT NULL,
	`first_last_name` VARCHAR(128) NULL DEFAULT NULL,
	`preferred_name` VARCHAR(128) NULL DEFAULT NULL,
	`membership` VARCHAR(32) NULL DEFAULT NULL,
	`birthday` DATE NULL DEFAULT NULL,
	`gender` VARCHAR(32) NULL DEFAULT '',
	`life_stage` VARCHAR(32) NULL DEFAULT '',
	`child_stage_allergies` LONGTEXT NULL DEFAULT NULL,
	`is_volunteer` CHAR(1) NULL DEFAULT 'N',
	`interest_volunteer` CHAR(1) NULL DEFAULT NULL,
	`donate_account_id` INT(11) NULL DEFAULT NULL,
	`created_from` VARCHAR(32) NULL DEFAULT '',
	`photo_profile` VARCHAR(64) NULL DEFAULT NULL,
	`custom_fields_data` TEXT NULL DEFAULT NULL,
	`created_at` DATETIME NULL DEFAULT current_timestamp(),
	`updated_at` DATETIME NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
	`updated_at_sync` DATETIME NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
	`sync_log` VARCHAR(100) NULL DEFAULT NULL,
	`call_list` SMALLINT(1) NULL DEFAULT 1,
	PRIMARY KEY (`id`),
	INDEX `idx_ad_is_volunteer` (`is_volunteer`, `interest_volunteer`),
	INDEX `idx_ad_email` (`email`)
)
ENGINE=InnoDB
;
");

        printd(get_class($this) . '<br>');
    }

    public function down() {
        
    }

}
