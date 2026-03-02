<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_transactions_planing_center extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("ALTER TABLE `transactions_funds`
	ADD COLUMN `plcenter_last_update` DATETIME NULL DEFAULT NULL AFTER `net`,
	ADD COLUMN `plcenter_pushed` CHAR(1) NULL DEFAULT NULL COMMENT 'Y | null' AFTER `plcenter_last_update`;");

        $this->db->query("ALTER TABLE `users`
	ADD COLUMN `planning_center_oauth` TEXT NULL DEFAULT NULL AFTER `gbarber_app_created_attempt`;");

        echo "Migration_transactions_planing_center";

        //$this->db->query("");        
        //printd('<b>comment when adding data</b>');
    }

    public function down() {
        
    }

}
