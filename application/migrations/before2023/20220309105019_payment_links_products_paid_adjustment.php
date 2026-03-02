<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_payment_links_products_paid_adjustment extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_payment_links_products_paid_adjustment</p>");

        $this->db->query("ALTER TABLE `payment_link_products_paid`
	ADD COLUMN `tranx_id` INT(11) NULL DEFAULT NULL AFTER `id`,
	CHANGE COLUMN `payment_link_id` `payment_link_id` INT(11) NULL DEFAULT NULL AFTER `tranx_id`,
	CHANGE COLUMN `product_id` `product_id` INT(11) NULL DEFAULT NULL AFTER `payment_link_id`,
	CHANGE COLUMN `qty` `qty_sent` INT(11) NULL DEFAULT NULL AFTER `product_id`,
	ADD INDEX `tranx_id` (`tranx_id`);
");

        $this->db->query("ALTER TABLE `payment_link_products_paid`
	ADD COLUMN `product_name` VARCHAR(200) NULL DEFAULT NULL AFTER `product_id`,
	ADD COLUMN `product_price` INT(11) NULL DEFAULT NULL AFTER `qty_sent`;");

        $this->db->query("ALTER TABLE `payment_link_products_paid`
	CHANGE COLUMN `qty_sent` `qty_req` INT(11) NULL DEFAULT NULL AFTER `product_name`;");

        $this->db->query("ALTER TABLE `payment_link_products_paid`
	CHANGE COLUMN `qty_req` `qty_req` INT(11) NULL DEFAULT NULL COMMENT 'Qty requested or sent by the customer' AFTER `product_name`;");

        $this->db->query("ALTER TABLE `payment_link_products_paid`
	CHANGE COLUMN `tranx_id` `transaction_id` INT(11) NULL DEFAULT NULL AFTER `id`;");
        
        $this->db->query("ALTER TABLE `payment_link_products_paid`
	CHANGE COLUMN `qty_req` `qty_req` INT(11) UNSIGNED NULL DEFAULT NULL COMMENT 'Qty requested or sent by the customer' AFTER `product_name`,
	CHANGE COLUMN `product_price` `product_price` DECIMAL(10,2) NULL DEFAULT NULL AFTER `qty_req`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
    }

    public function down() {
        
    }

}
