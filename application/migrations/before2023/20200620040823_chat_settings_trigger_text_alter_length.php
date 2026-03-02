<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_chat_settings_trigger_text_alter_length extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("ALTER TABLE chatgive.chat_settings MODIFY COLUMN trigger_text varchar(56) DEFAULT NULL NULL;");
        
        printd(get_class($this));
        
        //$this->db->query('');        
        //printd('<b>comment when adding data</b>');
        
    }

    public function down() {
        
    }

}
