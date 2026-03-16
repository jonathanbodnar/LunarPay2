<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_delete_orgn_flag extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("ALTER TABLE `church_detail`
	ADD COLUMN `deleted` TINYINT NOT NULL DEFAULT '0' AFTER `token`;
");
        
        printd(get_class($this));
        
        //$this->db->query('');        
        //printd('<b>comment when adding data</b>');
        
    }

    public function down() {
        
    }

}
