<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_change_orgn_flag_trash extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query('ALTER TABLE `church_detail`
	CHANGE COLUMN `deleted` `trash` TINYINT(4) NOT NULL DEFAULT 0 AFTER `token`;
');
        
        printd(get_class($this));
        
        //$this->db->query('');        
        //printd('<b>comment when adding data</b>');
        
    }

    public function down() {
        
    }

}
