<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_paysafe_webooks_system extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_paysafe_webooks_system</p>");

        $this->db->query("ALTER TABLE `paysafe_webhooks`
	ADD COLUMN `system` VARCHAR(50) NULL DEFAULT NULL AFTER `event_json`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
