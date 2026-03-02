<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_user_slack_channel extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_user_slack_channel</p>");

        $this->db->query("ALTER TABLE `users` ADD `slack_channel` VARCHAR(40) NULL DEFAULT NULL AFTER `slack_oauth`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
