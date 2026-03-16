<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_paysafe_onboard_currency extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_paysafe_onboard_currency</p>");

        $this->db->query("ALTER TABLE `church_onboard_paysafe`
	ADD COLUMN `currency` VARCHAR(3) NULL DEFAULT 'USD' AFTER `merchant_name`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
