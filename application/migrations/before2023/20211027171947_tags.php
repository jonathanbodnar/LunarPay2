<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_tags extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_tags</p>");

        $this->db->query("CREATE TABLE `tags` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`client_id` INT(11) UNSIGNED NULL DEFAULT NULL,
	`name` VARCHAR(64) NULL DEFAULT NULL,
	`scope` CHAR(1) NULL DEFAULT NULL COMMENT 'B = Batches',
	`created_at` DATETIME NULL DEFAULT NULL,
	PRIMARY KEY (`id`),
	UNIQUE INDEX `client_id_name_scope` (`client_id`, `name`, `scope`),
	INDEX `client_id_name_scope_k` (`client_id`, `name`, `scope`),
	INDEX `client_id_ks` (`client_id`),
	INDEX `scope_ks` (`scope`)
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
