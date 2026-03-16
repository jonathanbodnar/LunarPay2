<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_adjust_account_donor extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query('ALTER TABLE `account_donor`
	CHANGE COLUMN `phone` `phone` VARCHAR(32) NULL DEFAULT NULL AFTER `email`,
	CHANGE COLUMN `state` `state` VARCHAR(64) NULL DEFAULT NULL AFTER `id_church`,
	CHANGE COLUMN `address` `address` TEXT NULL DEFAULT NULL AFTER `state`,
	CHANGE COLUMN `city` `city` VARCHAR(128) NULL DEFAULT NULL AFTER `address`,
	CHANGE COLUMN `postal_code` `postal_code` VARCHAR(16) NULL DEFAULT NULL AFTER `city`;
');
        
        $this->db->query('ALTER TABLE `account_donor`
	ADD COLUMN `phone_code` VARCHAR(5) NULL DEFAULT NULL AFTER `email`;');             

        printd(get_class($this));

        //$this->db->query('');        
        //printd('<b>comment when adding data</b>');
    }

    public function down() {
        
    }

}
