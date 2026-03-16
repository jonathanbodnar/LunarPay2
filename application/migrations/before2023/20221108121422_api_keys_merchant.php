<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_api_keys_merchant extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_api_keys_merchant</p>");

        $this->db->query("CREATE TABLE `api_keys_merchant` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`church_id` INT(11) NULL DEFAULT NULL,
	`campus_id` INT(11) NULL DEFAULT NULL,
	`token` VARCHAR(130) NULL DEFAULT NULL,
	`created_at` DATETIME NULL DEFAULT NULL,
	PRIMARY KEY (`id`),
	INDEX `church_id` (`church_id`),
	INDEX `token` (`token`),
	INDEX `campus_id` (`campus_id`)
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
