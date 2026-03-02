<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_chat_settings_column_debug_message extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("ALTER TABLE chatgive.chat_settings ADD debug_message TINYINT DEFAULT 0;");
        
        printd(get_class($this));
        
        //$this->db->query('');        
        //printd('<b>comment when adding data</b>');
        
    }

    public function down() {
        
    }

}
