<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_church_detail_field_token extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query('ALTER TABLE chatgive.church_detail ADD COLUMN `token` varchar(32) NULL;');

        printd(get_class($this));
        
        //$this->db->query('');        
        //printd('<b>comment when adding data</b>');
        
    }

    public function down() {
        
    }

}
