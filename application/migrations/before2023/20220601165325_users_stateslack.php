<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_users_stateslack extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_users_stateslack</p>");

        //D => Disabled
        $this->db->query("ALTER TABLE `users` ADD `slack_status` CHAR(1) NULL DEFAULT 'D' AFTER `quickbooks_oauth`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
