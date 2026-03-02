<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_users_freshbooks_oauth extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_freshbooks_oauth</p>");

        $this->db->query("ALTER TABLE users ADD freshbooks_oauth TEXT NULL DEFAULT NULL AFTER stripe_oauth;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
