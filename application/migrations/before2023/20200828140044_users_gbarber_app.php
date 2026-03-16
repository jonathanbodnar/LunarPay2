<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_users_gbarber_app extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("ALTER TABLE `users`
	ADD COLUMN `gbarber_app_status` CHAR(1) NULL DEFAULT NULL COMMENT 'V | E' AFTER `access_token`;
");

        $this->db->query("ALTER TABLE `users`
	ADD COLUMN `gbarber_app_url` VARCHAR(256) NULL DEFAULT NULL AFTER `gbarber_app_status`;");

        $this->db->query("ALTER TABLE `users`
        ADD COLUMN `gbarber_app_created_attempt` DATETIME NULL DEFAULT NULL AFTER `gbarber_app_url`;");


        printd(get_class($this));

        //$this->db->query("");        
        //printd('<b>comment when adding data</b>');
    }

    public function down() {
        
    }

}
