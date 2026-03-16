<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_church_detail_zapier_notify extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("ALTER TABLE `church_detail`
	ADD COLUMN `zapier_notify_not_completed` INT NULL DEFAULT NULL AFTER `created_at`;
");
        
        printd(get_class($this));
        
        //$this->db->query('');        
        //printd('<b>comment when adding data</b>');
        
    }

    public function down() {
        
    }

}
