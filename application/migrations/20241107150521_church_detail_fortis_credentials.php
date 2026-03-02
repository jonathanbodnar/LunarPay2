<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_church_detail_fortis_credentials extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_church_detail_fortis_credentials</p>");

        $this->db->query("ALTER TABLE `church_detail` ADD `fortis_credentials` VARCHAR(500) NULL DEFAULT NULL AFTER `epicpay_template`;");
        $this->db->query("ALTER TABLE `church_detail` ADD `fortis_location_id` VARCHAR(64) NULL DEFAULT NULL AFTER `fortis_credentials`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
