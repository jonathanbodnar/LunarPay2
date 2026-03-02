<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_church_detail_and_onboard_fts_adjust extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_church_detail_and_onboard_fts_adjust</p>");

        $this->db->query("ALTER TABLE `church_detail` DROP `fortis_credentials`;");
        $this->db->query("ALTER TABLE `church_detail` DROP `fortis_location_id`;");
        $this->db->query("ALTER TABLE `church_onboard_fortis` ADD `credentials` VARCHAR(500) NULL DEFAULT NULL AFTER `processor_response`;");
        $this->db->query("ALTER TABLE `church_onboard_fortis` ADD `location_id` VARCHAR(64) NULL DEFAULT NULL AFTER `credentials`;");
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
