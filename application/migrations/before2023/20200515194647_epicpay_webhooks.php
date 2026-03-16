<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_epicpay_webhooks extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("CREATE TABLE `epicpay_webhooks` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`event_json` LONGTEXT NULL DEFAULT NULL,
	`status` CHAR(1) NULL DEFAULT 'U',
	`created_at` DATETIME NULL DEFAULT NULL,
	`updated_at` DATETIME NULL DEFAULT NULL,
	PRIMARY KEY (`id`),
	INDEX `idx_epw_created_at` (`created_at`),
	INDEX `idx_epw_updated_at` (`updated_at`)
)
ENGINE=InnoDB
;
");

        $this->db->query("CREATE TABLE `epicpay_webhooks_backup` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`event_json` LONGTEXT NULL DEFAULT NULL,
	`status` CHAR(1) NULL DEFAULT 'U',
	`option` VARCHAR(32) NULL DEFAULT NULL,
	`created_at` DATETIME NULL DEFAULT NULL,
	`updated_at` DATETIME NULL DEFAULT NULL,
	PRIMARY KEY (`id`),
	INDEX `idx_epw_created_at` (`created_at`),
	INDEX `idx_epw_updated_at` (`updated_at`)
)
ENGINE=InnoDB
;");

        printd(get_class($this));

        //$this->db->query('');        
        //printd('<b>comment when adding data</b>');
    }

    public function down() {
        
    }

}
