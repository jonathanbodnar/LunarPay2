<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_subscription_wehooks_tracking extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_subscription_wehooks_tracking</p>");

        $this->db->query("ALTER TABLE `epicpay_customer_subscriptions`
ADD COLUMN `webhook_closed` TINYINT(1) UNSIGNED NOT NULL DEFAULT 1 AFTER `status`,
ADD COLUMN `webhook_last_state_sent` TEXT AFTER `webhook_closed`,
ADD COLUMN `webhook_sent_log` LONGTEXT AFTER `webhook_last_state_sent`,
ADD INDEX `idx_webhook_closed` (`webhook_closed`);");
        
        $this->db->query("ALTER TABLE `epicpay_customer_subscriptions`
ALTER COLUMN `webhook_closed` SET DEFAULT 0;");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
