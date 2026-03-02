<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_users_stripe_oauth extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_users_stripe_oauth</p>");

        $this->db->query("ALTER TABLE `users` ADD `stripe_oauth` TEXT NULL DEFAULT NULL AFTER `planning_center_oauth`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
