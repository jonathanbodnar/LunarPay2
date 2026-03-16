<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_batch_tags extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_batch_tags</p>");

        $this->db->query("CREATE TABLE `batch_tags` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`tag_id` INT(10) UNSIGNED NOT NULL DEFAULT 0,
	`batch_id` INT(11) UNSIGNED NULL DEFAULT NULL,
	`created_at` DATETIME NULL DEFAULT NULL,
	PRIMARY KEY (`id`),
	INDEX `batch_id` (`batch_id`),
	INDEX `tag_id` (`tag_id`)
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
