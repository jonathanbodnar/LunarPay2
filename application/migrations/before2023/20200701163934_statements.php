<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_statements extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("CREATE TABLE `statements` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`type` VARCHAR(10) NULL DEFAULT NULL,        
	`client_id` INT(10) UNSIGNED NOT NULL,
        `created_by` CHAR(1) NULL DEFAULT 'U' COMMENT 'U: User | D: Donor',
        `account_donor_id` INT(10) UNSIGNED NOT NULL,
	`church_id` INT(10) UNSIGNED NOT NULL,
	`date_from` DATE NOT NULL,
	`date_to` DATE NOT NULL,
	`created_at` DATETIME NOT NULL,
	`updated_at` DATETIME NULL DEFAULT NULL,
	PRIMARY KEY (`id`),
	INDEX `idx_statmns_client_id` (`client_id`),
	INDEX `idx_statmns_church_id` (`church_id`),
	INDEX `idx_statmns_created_at` (`created_at`),
	INDEX `idx_statmns_updated_at` (`updated_at`),
	INDEX `idx_statmns_type` (`type`),
        INDEX `idx_statmns_account_donor_id` (`account_donor_id`)                
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
