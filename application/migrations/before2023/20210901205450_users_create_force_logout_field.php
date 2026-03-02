<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_users_create_force_logout_field extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_users_create_force_logout_field</p>");

        $this->db->query("ALTER TABLE `users`
	ADD COLUMN `force_logout` TINYINT UNSIGNED NULL DEFAULT NULL AFTER `starter_step`;
");

        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
    }

    public function down() {
        
    }

}
