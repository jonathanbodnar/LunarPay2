<?php

defined('BASEPATH') or exit('No direct script access allowed');

class Migration_table_fortis_webhooks extends CI_Migration
{

    public function __construct()
    {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up()
    {

        printd("<p>Migration_table_fortis_webhooks</p>");

        $this->db->query("
        CREATE TABLE `fortis_webhooks` (
            `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
            `event_json` TEXT NULL DEFAULT NULL,
            `system` VARCHAR(50) NULL DEFAULT NULL,
            `mode` VARCHAR(32) NULL DEFAULT NULL,
            `created_at` DATETIME NULL DEFAULT NULL,
            PRIMARY KEY (`id`),
            INDEX `idx_epw_created_at` (`created_at`),
            INDEX `mode` (`mode`)
        )
        COLLATE='utf8_general_ci'
        ENGINE=InnoDB        
        ;
        
        ");

        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');

    }

    public function down()
    {
    }
}
