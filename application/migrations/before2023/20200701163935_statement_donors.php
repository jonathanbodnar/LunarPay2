<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_statement_donors extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query('CREATE TABLE `statement_donors` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`statement_id` INT(10) UNSIGNED NOT NULL,
	`church_id` INT(10) UNSIGNED NOT NULL,
	`donor_email` VARCHAR(255) NULL DEFAULT NULL,
	`donor_name` VARCHAR(255) NULL DEFAULT NULL,
	`file_name` VARCHAR(255) NULL DEFAULT NULL,
	`created_at` DATETIME NOT NULL,
	`updated_at` DATETIME NULL DEFAULT NULL,
	PRIMARY KEY (`id`),
	INDEX `idx_stdonors_statement_id` (`statement_id`),
	INDEX `idx_stdonors_donor_email` (`donor_email`),
	INDEX `idx_stdonors_created_at` (`created_at`),
	INDEX `idx_stdonors_updated_at` (`updated_at`)
)
ENGINE=InnoDB
;
');
        
        printd(get_class($this));
        
        //$this->db->query('');        
        //printd('<b>comment when adding data</b>');
        
    }

    public function down() {
        
    }

}
