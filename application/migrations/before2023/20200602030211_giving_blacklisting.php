<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_giving_blacklisting extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("CREATE TABLE `giving_blacklisted_ips` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`ip` VARCHAR(45) NULL DEFAULT NULL,
	`obj_log` TEXT NULL DEFAULT NULL,
	`created_at` DATETIME NULL DEFAULT NULL,
	`updated_at` DATETIME NULL DEFAULT NULL,
	`status` TINYINT(3) UNSIGNED NULL DEFAULT 1,
	PRIMARY KEY (`id`),
	INDEX `ip` (`ip`)
)
ENGINE=InnoDB
");
        
        printd(get_class($this));
        
        //$this->db->query('');        
        //printd('<b>comment when adding data</b>');
        
    }

    public function down() {
        
    }

}
