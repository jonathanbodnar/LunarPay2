<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_table_user_starter_step extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("ALTER TABLE users ADD starter_step INT DEFAULT 1 NULL;");
        
        echo "<p>Migration_table_user_starter_step</p>";
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
