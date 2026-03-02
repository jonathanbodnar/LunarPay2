<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_church_detail_legalname extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("ALTER TABLE `church_detail`
	ADD COLUMN `legal_name` VARCHAR(100) NOT NULL COMMENT 'Merchant\'s business legal name' AFTER `church_name`;
");

        printd(get_class($this));

        //$this->db->query('');        
        //printd('<b>comment when adding data</b>');
    }

    public function down() {
        
    }

}
