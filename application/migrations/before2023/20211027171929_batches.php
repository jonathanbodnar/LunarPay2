<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_batches extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_batches</p>");

        $this->db->query("CREATE TABLE `batches` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`name` VARCHAR(64) NULL DEFAULT NULL,
	`church_id` INT(11) UNSIGNED NULL DEFAULT NULL,
	`campus_id` INT(11) UNSIGNED NULL DEFAULT NULL,
	`created_at` DATETIME NULL DEFAULT NULL,
	PRIMARY KEY (`id`),
	INDEX `name` (`name`),
	INDEX `church_id` (`church_id`),
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
