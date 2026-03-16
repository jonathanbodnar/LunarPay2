<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_onboarding_crypto_api_fields extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_onboarding_crypto_api_fields</p>");

                $this->db->query("ALTER TABLE `church_onboard_crypto`
	ADD COLUMN `api_requests` TEXT NULL DEFAULT NULL AFTER `currency`,
	ADD COLUMN `api_responses` TEXT NULL DEFAULT NULL AFTER `api_requests`;
");

        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
