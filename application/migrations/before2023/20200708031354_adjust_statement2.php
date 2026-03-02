<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_adjust_statement2 extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query('ALTER TABLE `statements`
	CHANGE COLUMN `client_id` `client_id` INT(10) UNSIGNED NULL DEFAULT NULL AFTER `type`,
	CHANGE COLUMN `church_id` `church_id` INT(10) UNSIGNED NULL DEFAULT NULL AFTER `account_donor_id`,
	CHANGE COLUMN `date_from` `date_from` DATE NULL DEFAULT NULL AFTER `church_id`,
	CHANGE COLUMN `date_to` `date_to` DATE NULL DEFAULT NULL AFTER `date_from`,
	CHANGE COLUMN `file_name` `file_name` VARCHAR(255) NULL DEFAULT NULL AFTER `date_to`,
	CHANGE COLUMN `created_at` `created_at` DATETIME NULL DEFAULT NULL AFTER `file_name`;
');

        printd(get_class($this));

        //$this->db->query('');        
        //printd('<b>comment when adding data</b>');
    }

    public function down() {
        
    }

}
