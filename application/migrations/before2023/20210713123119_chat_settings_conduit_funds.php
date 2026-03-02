<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_chat_settings_conduit_funds extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_chat_settings_conduit_funds</p>");

        $this->db->query("ALTER TABLE chat_settings ADD type_widget varchar(50) DEFAULT 'standard' NULL;");
        $this->db->query("ALTER TABLE chat_settings ADD conduit_funds varchar(1000) NULL;");

        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
