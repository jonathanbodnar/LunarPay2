<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_church_detail_twilio_country_code_and_number extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_church_detail_twilio_country_code_and_number</p>");

        $this->db->query("ALTER TABLE `church_detail`
	ADD COLUMN `twilio_country_code` VARCHAR(2) NULL DEFAULT NULL AFTER `twilio_phonesid`,
	ADD COLUMN `twilio_country_number` VARCHAR(7) NULL DEFAULT NULL AFTER `twilio_country_code`;
");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
