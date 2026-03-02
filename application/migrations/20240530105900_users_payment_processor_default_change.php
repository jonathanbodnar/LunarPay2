<?php

defined('BASEPATH') or exit('No direct script access allowed');

class Migration_users_payment_processor_default_change extends CI_Migration
{

    public function __construct()
    {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up()
    {

        printd("<p>Migration_users_payment_processor_default_change</p>");

        $this->db->query("
        ALTER TABLE `users`
	CHANGE COLUMN `payment_processor` `payment_processor` VARCHAR(3) NULL DEFAULT 'FTS' COMMENT 'EPP: Epicpay, PSF: Paysafe' AFTER `permissions`;

        ");

        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');

    }

    public function down()
    {
    }
}
