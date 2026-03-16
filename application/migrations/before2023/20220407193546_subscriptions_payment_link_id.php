<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_subscriptions_payment_link_id extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_subscriptions_payment_link_id</p>");

        $this->db->query("ALTER TABLE `epicpay_customer_subscriptions`
	ADD COLUMN `payment_link_products_id` INT(10) UNSIGNED NULL DEFAULT NULL COMMENT 'payment_link_products.ID' AFTER `paysafe_fail_trxns`,
	ADD INDEX `payment_link_products_id` (`payment_link_products_id`);
");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
