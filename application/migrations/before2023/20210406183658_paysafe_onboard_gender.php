<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_paysafe_onboard_gender extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_paysafe_onboard_gender</p>");

        $this->db->query("ALTER TABLE `church_onboard_paysafe`
	ADD COLUMN `owner_gender` VARCHAR(1) NULL DEFAULT NULL AFTER `owner_nationality`;
");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
