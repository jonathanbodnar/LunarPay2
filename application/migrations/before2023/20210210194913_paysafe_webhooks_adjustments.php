<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_paysafe_webhooks_adjustments extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("ALTER TABLE `paysafe_webhooks`
	ADD COLUMN `mode` VARCHAR(32) NULL DEFAULT NULL AFTER `event_json`,
	DROP COLUMN `option`,
	ADD INDEX `mode` (`mode`);
");

        echo "<p>Migration_paysafe_webhooks_adjustments</p>";

        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
    }

    public function down() {
        
    }

}
