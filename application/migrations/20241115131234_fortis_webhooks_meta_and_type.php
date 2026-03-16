<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_fortis_webhooks_meta_and_type extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_fortis_webhooks_meta_and_type</p>");

        $this->db->query("ALTER TABLE `fortis_webhooks` ADD `type` VARCHAR(32) NULL AFTER `id`;");
        $this->db->query("ALTER TABLE `fortis_webhooks` ADD `meta` TEXT NULL DEFAULT NULL AFTER `event_json`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
