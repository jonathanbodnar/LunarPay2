<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_add_webhook_config_to_api_merchant_credentials extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_add_webhook_config_to_api_merchant_credentials</p>");

        $this->db->query("ALTER TABLE `api_merchant_credentials` 
            ADD COLUMN `webhook_config` TEXT NULL DEFAULT NULL 
            COMMENT 'JSON configuration for webhook endpoints and events' 
            AFTER `api_secret_hash`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        $this->db->query("ALTER TABLE `api_merchant_credentials` DROP COLUMN `webhook_config`;");
    }

} 