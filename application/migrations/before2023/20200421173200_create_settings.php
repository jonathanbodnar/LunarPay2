<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_create_settings extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("CREATE TABLE `settings` (
	`settings_id` INT(11) NOT NULL AUTO_INCREMENT,
	`type` LONGTEXT NOT NULL,
	`description` LONGTEXT NOT NULL,
	PRIMARY KEY (`settings_id`)
)
ENGINE=InnoDB
;
");
        
        printd(get_class($this));
        
        $this->db->query("INSERT INTO `settings` (`type`, `description`) VALUES('is_new_donor_before_days', '30');");
        
        printd('<b>added is_new_donor_before_days field</b>');
        
    }

    public function down() {
        
    }

}
