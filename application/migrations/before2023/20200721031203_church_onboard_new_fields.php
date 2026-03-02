<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_church_onboard_new_fields extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("ALTER TABLE `church_onboard`
	ADD COLUMN `sign_date_of_birth` DATE NULL DEFAULT NULL AFTER `sign_last_name`,
	ADD COLUMN `sign_ownership_percent` VARCHAR(3) NULL DEFAULT NULL COMMENT 'Primary principal or signer\'s ownership percent' AFTER `sign_title`,
	ADD COLUMN `sign_address_line_1` VARCHAR(100) NULL DEFAULT NULL AFTER `sign_postal_code`,
	ADD COLUMN `sign_address_line_2` VARCHAR(100) NULL DEFAULT NULL AFTER `sign_address_line_1`;
");
        
        printd(get_class($this));
        
        //$this->db->query('');        
        //printd('<b>comment when adding data</b>');
        
    }

    public function down() {
        
    }

}
