<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_church_detail_new_columns extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("ALTER TABLE `church_detail`
	ADD COLUMN `street_address_suite` VARCHAR(300) NOT NULL AFTER `street_address`;
");

        $this->db->query("ALTER TABLE `church_detail`
	ALTER `phone_no` DROP DEFAULT;
");

        $this->db->query("ALTER TABLE `church_detail`
	CHANGE COLUMN `phone_no` `phone_no` VARCHAR(128) NOT NULL COMMENT 'Merchant\'s business phone number' AFTER `church_name`;
");

        printd(get_class($this));

        //$this->db->query('');        
        //printd('<b>comment when adding data</b>');
    }

    public function down() {
        
    }

}
