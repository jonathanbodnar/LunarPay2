<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_users_add_comments_to_force_logout extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_users_add_comments_to_force_logout</p>");

        $this->db->query("ALTER TABLE `users`
	CHANGE COLUMN `force_logout` `force_logout` TINYINT(3) UNSIGNED NULL DEFAULT NULL COMMENT 'This field is set to null always that the user log in (team member)' AFTER `starter_step`;
");

        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
    }

    public function down() {
        
    }

}
