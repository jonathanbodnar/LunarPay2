<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_subs_states extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_subs_states</p>");

        $this->db->query("ALTER TABLE `epicpay_customer_subscriptions` 
ADD COLUMN `c_status` ENUM('on_trial', 'active', 'unpaid', 'cancelled') NULL COMMENT 'Calculated subscription status' AFTER `status`,
ADD COLUMN `trial_status` ENUM('active', 'ended') NULL COMMENT 'Trial period status' AFTER `c_status`,
ADD COLUMN `access_period_status` ENUM('active', 'ended') NULL COMMENT 'Access period status' AFTER `trial_status`,
ADD COLUMN `trial_ends_at` DATETIME NULL COMMENT 'When trial period ends' AFTER `access_period_status`,
ADD COLUMN `ends_at` DATETIME NULL COMMENT 'When subscription access ends' AFTER `trial_ends_at`,
ADD COLUMN `created_as_trial` TINYINT(1) UNSIGNED NULL DEFAULT 0 COMMENT 'Whether subscription was created with trial' AFTER `ends_at`,
ADD COLUMN `status_calculated_at` DATETIME NULL COMMENT 'When status was last calculated' AFTER `created_as_trial`;");
        
        $this->db->query("ALTER TABLE `epicpay_customer_subscriptions` CHANGE `next_payment_on` `next_payment_on` DATETIME NULL DEFAULT NULL;");        
        printd('<p><b>next_payment_on</b></p>');
        
    }

    public function down() {
        
    }

}
