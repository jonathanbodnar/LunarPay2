<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_users_permissions extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("ALTER TABLE `users`
	ADD COLUMN `permissions` TEXT NULL DEFAULT NULL AFTER `planning_center_oauth`;
");
        
        echo "Migration_users_access_filters <br>";
        
                $this->db->query("ALTER TABLE `users`
	ADD COLUMN `parent_id` INT NULL DEFAULT NULL COMMENT 'Team member parent' AFTER `planning_center_oauth`;
");
        
        echo "parent_id field added <br>";
        
        //$this->db->query("");        
        //printd('<b>comment when adding data</b>');
        
    }

    public function down() {
        
    }

}
