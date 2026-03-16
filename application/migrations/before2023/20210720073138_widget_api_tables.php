<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_widget_api_tables extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_widget_api_tables</p>");

        $this->db->query("CREATE TABLE `api_access_token` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`church_id` INT(11) NULL DEFAULT NULL,
	`phone` VARCHAR(16) NULL DEFAULT NULL,
	`token` VARCHAR(60) NULL DEFAULT NULL,
	`expire_at` DATETIME NULL DEFAULT NULL,
	PRIMARY KEY (`id`),
	INDEX `church_id` (`church_id`),
	INDEX `phone` (`phone`),
	INDEX `token` (`token`)
)
ENGINE=InnoDB
;
");
        $this->db->query("CREATE TABLE `api_refresh_token` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`church_id` INT(11) NULL DEFAULT NULL,
	`phone` VARCHAR(16) NULL DEFAULT NULL,
	`token` VARCHAR(60) NULL DEFAULT NULL,
	`expire_at` DATETIME NULL DEFAULT NULL,
	PRIMARY KEY (`id`),
	INDEX `church_id` (`church_id`),
	INDEX `phone` (`phone`),
	INDEX `token` (`token`)
)
ENGINE=InnoDB
;");

        $this->db->query("ALTER TABLE `api_access_token`
	ADD COLUMN `session_data` LONGTEXT NULL DEFAULT NULL AFTER `expire_at`;
");
        //printd('<p><b>comment when adding data</b></p>');
    }

    public function down() {
        
    }

}
