<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_account_donor_registration_adjust extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query(""
                . "ALTER TABLE `account_donor`
	CHANGE COLUMN `created_from` `created_from` CHAR(1) NULL DEFAULT NULL COMMENT 'R => Registration' AFTER `donate_account_id`,
	ADD INDEX `created_from` (`created_from`);
");
        
        echo "Migration_account_donor_registration_adjust";
        //printd('<b>comment when adding data</b>');
    }

    public function down() {
        
    }

}
