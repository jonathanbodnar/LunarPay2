<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_fts_onboarding_remove_credentials extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_fts_onboarding_remove_credentials</p>");

        $this->db->query("ALTER TABLE `church_onboard_fortis` DROP `auth_user_id`;");
        $this->db->query("ALTER TABLE `church_onboard_fortis` DROP `auth_user_api_key`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
