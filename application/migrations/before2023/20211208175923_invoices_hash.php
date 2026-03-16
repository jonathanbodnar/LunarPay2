<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_invoices_hash extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_invoices_hash</p>");

        $this->db->query("ALTER TABLE `invoices`
	ADD COLUMN `hash` VARCHAR(150) NULL DEFAULT NULL AFTER `church_id`,
	ADD INDEX `hash` (`hash`);
");

        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
    }

    public function down() {
        
    }

}
