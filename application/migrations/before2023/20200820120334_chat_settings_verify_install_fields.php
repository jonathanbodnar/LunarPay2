<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_chat_settings_verify_install_fields extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query('ALTER TABLE chat_settings 
                            ADD COLUMN install_status_date DATETIME NULL,
                            ADD COLUMN install_status char(1) NULL;');

        printd(get_class($this));
        
        //$this->db->query('');        
        //printd('<b>comment when adding data</b>');
        
    }

    public function down() {
        
    }

}
