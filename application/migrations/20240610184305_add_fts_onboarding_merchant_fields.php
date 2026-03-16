<?php

defined('BASEPATH') or exit('No direct script access allowed');

class Migration_add_fts_onboarding_merchant_fields extends CI_Migration
{

    public function __construct()
    {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up()
    {

        printd("<p>Migration_add_fts_onboarding_merchant_fields</p>");

        $this->db->query("
        ALTER TABLE `church_onboard_fortis`
	ADD COLUMN `merchant_state` VARCHAR(2) NULL DEFAULT NULL AFTER `email`,
	ADD COLUMN `merchant_city` VARCHAR(50) NULL DEFAULT NULL AFTER `merchant_state`,
	ADD COLUMN `merchant_postal_code` VARCHAR(10) NULL DEFAULT NULL AFTER `merchant_city`;

        ");

        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');

    }

    public function down()
    {
    }
}
