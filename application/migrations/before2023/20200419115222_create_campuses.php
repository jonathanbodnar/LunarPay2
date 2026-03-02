<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_create_campuses extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("CREATE TABLE `campuses` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`name` VARCHAR(45) NULL DEFAULT NULL,
	`address` VARCHAR(45) NULL DEFAULT NULL,
	`phone` VARCHAR(45) NULL DEFAULT NULL,
	`photo` TEXT NULL DEFAULT NULL,
	`description` VARCHAR(45) NULL DEFAULT NULL,
	`pastor` VARCHAR(45) NULL DEFAULT NULL,
	`church_id` INT(11) NULL DEFAULT NULL,
	`cfeed_link` VARCHAR(64) NULL DEFAULT NULL,
	PRIMARY KEY (`id`)
)
ENGINE=InnoDB
;
");

        printd(get_class($this) . '<br>');
    }

    public function down() {
        
    }

}
