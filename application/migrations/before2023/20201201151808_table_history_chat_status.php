<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_table_history_chat_status extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("ALTER TABLE history_chat MODIFY COLUMN status char(1) NOT NULL COMMENT 'O open C complete I incomplete F failed';");
        $this->db->query("ALTER TABLE history_chat ADD archived TINYINT DEFAULT 0 NULL;");
        $this->db->query("ALTER TABLE history_chat CHANGE archived archived TINYINT DEFAULT 0 NULL AFTER status;");
        
        echo "<p>Migration_table_history_chat_status</p>";
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
