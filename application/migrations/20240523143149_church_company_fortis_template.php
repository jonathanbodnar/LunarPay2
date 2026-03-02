<?php

defined('BASEPATH') or exit('No direct script access allowed');

class Migration_church_company_fortis_template extends CI_Migration
{

    public function __construct()
    {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up()
    {

        printd("<p>Migration_church_company_fortis_template</p>");

        $this->db->query("
        ALTER TABLE `church_detail`
	    ADD COLUMN `fortis_template` VARCHAR(32) NULL DEFAULT NULL AFTER `epicpay_template`;
        ");

        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');

    }

    public function down()
    {
    }
}
