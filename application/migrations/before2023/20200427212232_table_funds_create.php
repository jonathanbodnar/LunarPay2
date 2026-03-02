<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_table_funds_create extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("CREATE TABLE `funds` (
                `id` INT(11) NOT NULL AUTO_INCREMENT,
                `name` VARCHAR(45) NULL DEFAULT NULL,
                `description` TEXT NULL DEFAULT NULL,	
                `church_id` INT(11) NULL DEFAULT NULL,
                `campus_id` INT(11) NULL DEFAULT NULL,
                `created_at` DATETIME NULL,
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
