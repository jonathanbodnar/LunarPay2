<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_account_donor_update_created_from_field extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_account_donor_update_created_from_field</p>");

        $this->db->query("ALTER TABLE `account_donor`
	CHANGE COLUMN `created_from` `created_from` VARCHAR(255) NULL DEFAULT NULL COMMENT 'controller/method' AFTER `donate_account_id`;
");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
