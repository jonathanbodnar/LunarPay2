<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_transactions_manual_failed extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("ALTER TABLE `epicpay_customer_transactions`
	ADD COLUMN `manual_failed` SMALLINT UNSIGNED NULL DEFAULT NULL COMMENT '1 if the transaction was set as failed manually by the user' AFTER `status_ach`;
");

        echo "<p>Migration_transactions_manual_failed</p>";

        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
    }

    public function down() {
        
    }

}
