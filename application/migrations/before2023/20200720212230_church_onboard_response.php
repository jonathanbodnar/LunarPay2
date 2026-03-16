<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_church_onboard_response extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("ALTER TABLE `church_onboard`
	ADD COLUMN `processor_response` TEXT NULL DEFAULT NULL AFTER `processor`;
");

        printd(get_class($this));

        //$this->db->query('');        
        //printd('<b>comment when adding data</b>');
    }

    public function down() {
        
    }

}
