<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_transaction_funds_fields_size_adjustment extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_transaction_funds_fields_size_adjustment</p>");

        $this->db->query("ALTER TABLE `transactions_funds`
	CHANGE COLUMN `amount` `amount` DECIMAL(15,4) NULL DEFAULT NULL AFTER `fund_id`,
	CHANGE COLUMN `fee` `fee` DECIMAL(15,4) NULL DEFAULT NULL AFTER `amount`,
	CHANGE COLUMN `net` `net` DECIMAL(15,2) NULL DEFAULT NULL AFTER `fee`;
");

        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
    }

    public function down() {
        
    }

}
