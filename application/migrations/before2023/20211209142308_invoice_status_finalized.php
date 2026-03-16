<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_invoice_status_finalized extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_invoice_status_finalized</p>");

        $this->db->query("ALTER TABLE `invoices`
	CHANGE COLUMN `hash` `hash` VARCHAR(150) NULL DEFAULT NULL AFTER `campus_id`,
	ADD COLUMN `status` CHAR(1) NULL DEFAULT 'U' COMMENT 'P = Paid, U = Unpaid' AFTER `donor_id`,
	ADD COLUMN `finalized` DATETIME NULL DEFAULT NULL AFTER `status`,
	ADD COLUMN `updated_at` DATETIME NULL DEFAULT NULL AFTER `created_at`,
	ADD INDEX `status` (`status`);
");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
