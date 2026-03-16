<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_onboarding_crypto_api_fields2 extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_onboarding_crypto_api_fields2</p>");

        $this->db->query("ALTER TABLE `church_onboard_crypto`
	ADD COLUMN `account_id` VARCHAR(128) NULL DEFAULT NULL AFTER `church_id`;       

");

        $this->db->query("ALTER TABLE `church_onboard_crypto`
	DROP COLUMN `currency`;
");
        
    }

    public function down() {
        
    }

}
