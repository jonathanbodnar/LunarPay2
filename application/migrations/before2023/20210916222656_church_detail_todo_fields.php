<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_church_detail_todo_fields extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_church_detail_todo_fields</p>");

        $this->db->query("ALTER TABLE `church_detail`
	ADD COLUMN `todo_action_required_by` TEXT NULL DEFAULT NULL COMMENT 'Used on super admin side' AFTER `todo_notes`,
	ADD COLUMN `todo_reference_date` DATE NULL DEFAULT NULL COMMENT 'Used on super admin side' AFTER `todo_action_required_by`;
");

        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
    }

    public function down() {
        
    }

}
