<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_users_role extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_users_role</p>");

        $this->db->query("ALTER TABLE `users` 
        
        ADD `role` ENUM('user','admin') NOT NULL DEFAULT 'user' 
        COMMENT 'An admin can access to the admin panel too' 
        AFTER `access_token`,
        
        ADD INDEX `idx_role` (`role`);");
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
