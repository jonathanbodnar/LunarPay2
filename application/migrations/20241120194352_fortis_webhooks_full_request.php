<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_fortis_webhooks_full_request extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_fortis_webhooks_full_request</p>");

        $this->db->query("ALTER TABLE `fortis_webhooks` ADD `full_request` TEXT NULL DEFAULT NULL AFTER `event_json`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
