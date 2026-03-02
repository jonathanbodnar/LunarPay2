<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_payment_link_products_paid_subscriptions extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_payment_link_products_paid_subscriptions</p>");

        $this->db->query("ALTER TABLE `payment_link_products_paid`
	CHANGE COLUMN `transaction_id` `transaction_id` INT(11) NULL DEFAULT NULL COMMENT 'When a payment transaction has been perfomed' AFTER `id`,
	ADD COLUMN `subscription_id` INT(11) NULL DEFAULT NULL COMMENT 'When a payment transaction has NOT been perfomed but a subscription has been created' AFTER `transaction_id`,
	ADD INDEX `subscription_id` (`subscription_id`);
");

        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
    }

    public function down() {
        
    }

}
