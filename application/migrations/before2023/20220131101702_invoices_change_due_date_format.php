<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_invoices_change_due_date_format extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_invoices_change_due_date_format</p>");

        $this->db->query("ALTER TABLE `invoices`
	CHANGE COLUMN `due_date` `due_date` DATE NULL DEFAULT NULL AFTER `total_amount`;
");

        $this->db->query("ALTER TABLE `invoices`
	CHANGE COLUMN `status` `status` CHAR(1) NULL DEFAULT 'D' COMMENT 'P = Paid, U = Unpaid/Open, D = Draft, E = Due' AFTER `due_date`;
");
        printd('<p><b>Comments added to the invoice table (P = Paid, U = Unpaid/Open, D = Draft, E = Due)</b></p>');
    }

    public function down() {
        
    }

}
