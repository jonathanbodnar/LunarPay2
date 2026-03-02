<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_church_detail_todo extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_church_detail_todo</p>");

        $this->db->query(""
                . "ALTER TABLE `church_detail`
	ADD COLUMN `todo_notes` TEXT NULL DEFAULT NULL COMMENT 'Used on super admin side' AFTER `slug`;
");

        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
    }

    public function down() {
        
    }

}
