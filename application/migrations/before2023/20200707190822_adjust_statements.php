<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_adjust_statements extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("ALTER TABLE `statements`
        ADD COLUMN `file_name` VARCHAR(255) NOT NULL DEFAULT '' AFTER `date_to`;");

        $this->db->query("ALTER TABLE `statements`
	CHANGE COLUMN `account_donor_id` `account_donor_id` INT(10) UNSIGNED NULL DEFAULT NULL AFTER `created_by`;");

        printd(get_class($this));

        //$this->db->query('');        
        //printd('<b>comment when adding data</b>');
    }

    public function down() {
        
    }

}
