<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_church_onboard_crypto extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_church_onboard_crytpo</p>");

        $this->db->query("CREATE TABLE `church_onboard_crypto` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`church_id` INT(11) UNSIGNED NOT NULL,
	`merchant_name` VARCHAR(100) NULL DEFAULT NULL,
	`currency` VARCHAR(3) NULL DEFAULT 'USD',
	PRIMARY KEY (`id`),
	INDEX `church_id` (`church_id`)
)
COLLATE='utf8_general_ci'
ENGINE=InnoDB
;

");

        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
    }

    public function down() {
        
    }

}
