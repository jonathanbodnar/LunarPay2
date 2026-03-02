<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_widget_api_tables_add_user_and_campus extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_widget_api_tables_add_user_and_campus</p>");

        $this->db->query("ALTER TABLE `api_access_token`
	ADD COLUMN `user_id` INT(11) NULL DEFAULT NULL AFTER `id`,
	ADD COLUMN `campus_id` INT(11) NULL DEFAULT NULL AFTER `church_id`,
	ADD INDEX `campus_id` (`campus_id`),
	ADD INDEX `user_id` (`user_id`);
");

        $this->db->query("ALTER TABLE `api_refresh_token`
	ADD COLUMN `user_id` INT(11) NULL DEFAULT NULL AFTER `id`,
	ADD COLUMN `campus_id` INT(11) NULL DEFAULT NULL AFTER `church_id`,
	ADD INDEX `campus_id` (`campus_id`),
	ADD INDEX `user_id` (`user_id`);
");
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
    }

    public function down() {
        
    }

}
