<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_paysafe_adjustments_2 extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("ALTER TABLE `church_detail`
	ADD COLUMN `paysafe_template` VARCHAR(32) NULL DEFAULT NULL AFTER `epicpay_template`;
");

        echo "<p>Migration_paysafe_adjustments_2</p>";

        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
    }

    public function down() {
        
    }

}
