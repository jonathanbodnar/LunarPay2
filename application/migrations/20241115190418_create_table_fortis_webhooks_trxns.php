<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_create_table_fortis_webhooks_trxns extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_create_table_fortis_trxns_tracked_webhooks</p>");

        $this->db->query("
    CREATE TABLE `fortis_trxns_tracked_webhooks` (
        `id` INT NOT NULL AUTO_INCREMENT, 
        `client_app_id` INT(11) NOT NULL,
        `webhook_id` VARCHAR(64) NULL,
        `request` TEXT NULL, 
        `response` TEXT NULL,
        `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, 
        `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        INDEX `idx_client_app_id` (`client_app_id`),
        INDEX `idx_webhook_id` (`webhook_id`)
    ) ENGINE = InnoDB CHARSET=utf8 
    COLLATE utf8_general_ci COMMENT = 'Track the transactions webhooks created on fortis side';
");     
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
