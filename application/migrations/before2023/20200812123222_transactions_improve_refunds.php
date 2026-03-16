<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_transactions_improve_refunds extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("ALTER TABLE `epicpay_customer_transactions`
	ADD COLUMN `trx_ret_id` INT NULL DEFAULT NULL AFTER `fee_acum`,
	ADD COLUMN `trx_retorigin_id` INT NULL DEFAULT NULL AFTER `trx_ret_id`;
");

        $this->db->query("ALTER TABLE `epicpay_customer_transactions`
	ADD COLUMN `trx_type` CHAR(2) NULL DEFAULT 'DO' AFTER `trx_retorigin_id`");

        printd(get_class($this));

        //$this->db->query('');        
        //printd('<b>comment when adding data</b>');
    }

    public function down() {
        
    }

}
