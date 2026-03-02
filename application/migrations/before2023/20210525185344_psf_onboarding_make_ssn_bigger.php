<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_psf_onboarding_make_ssn_bigger extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_psf_onboarding_make_ssn_bigger</p>");

        $this->db->query("ALTER TABLE `church_onboard_paysafe`
	CHANGE COLUMN `owner_ssn` `owner_ssn` VARCHAR(15) NULL DEFAULT NULL AFTER `owner_birth`;
");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
