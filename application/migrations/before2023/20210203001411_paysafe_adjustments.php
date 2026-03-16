<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_paysafe_adjustments extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("ALTER TABLE `epicpay_customers`
	ADD COLUMN `ispaysafe` TINYINT(3) UNSIGNED NULL DEFAULT NULL AFTER `from_stripemigration_onetime`;");

        $this->db->query("ALTER TABLE `epicpay_customers`
	ADD COLUMN `merchant_customer_id` VARCHAR(50) NULL DEFAULT NULL AFTER `ispaysafe`;");

        $this->db->query("ALTER TABLE `epicpay_customer_sources`
	ADD COLUMN `ispaysafe` TINYINT(3) UNSIGNED NULL DEFAULT NULL AFTER `ask_wallet_update`;");

        $this->db->query("ALTER TABLE `epicpay_customers`
        ADD COLUMN `billing_address` TEXT NULL DEFAULT NULL AFTER `merchant_customer_id`;");

        $this->db->query("ALTER TABLE `epicpay_customers`
	ADD COLUMN `request_response_bank` LONGTEXT NULL DEFAULT NULL AFTER `request_response`;");

        $this->db->query("ALTER TABLE `epicpay_customer_sources`
	ADD COLUMN `paysafe_source_id` VARCHAR(50) NULL DEFAULT NULL AFTER `ispaysafe`;");

        $this->db->query("ALTER TABLE `epicpay_customer_sources`
	ADD COLUMN `paysafe_billing_address_id` VARCHAR(50) NULL DEFAULT NULL AFTER `paysafe_source_id`;");

        $this->db->query("ALTER TABLE `epicpay_customer_subscriptions`
	ADD COLUMN `ispaysafe` TINYINT UNSIGNED NULL DEFAULT NULL AFTER `campaign_id`;");

        $this->db->query("ALTER TABLE `epicpay_customer_subscriptions`
	ADD COLUMN `paysafe_success_trxns` INT UNSIGNED NULL DEFAULT NULL AFTER `ispaysafe`,
	ADD COLUMN `paysafe_fail_trxns` INT UNSIGNED NULL DEFAULT NULL AFTER `paysafe_success_trxns`;
        ");

        $this->db->query("ALTER TABLE `epicpay_customer_subscriptions`
	ADD COLUMN `next_payment_on` DATE NULL DEFAULT NULL AFTER `start_on`;");

        echo "<p>Migration_paysafe_adjustments</p>";

        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
    }

    public function down() {
        
    }

}
