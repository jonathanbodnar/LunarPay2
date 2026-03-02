<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_cyrpto_wallet_active extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_cyrpto_wallet_active</p>");

        $this->db->query("ALTER TABLE `church_onboard_crypto`
	ADD COLUMN `active` TINYINT UNSIGNED NULL DEFAULT NULL AFTER `church_id`;
");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
