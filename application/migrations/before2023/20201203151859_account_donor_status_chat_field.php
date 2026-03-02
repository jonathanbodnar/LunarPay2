<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_account_donor_status_chat_field extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("ALTER TABLE account_donor ADD status_chat CHAR(1) DEFAULT 'O' NULL COMMENT 'O open A archive C close';");
        
        echo "<p>Migration_account_donor_status_chat_field</p>";
        
        //$this->db->query("");        
        //printd('<b>comment when adding data</b>');
        
    }

    public function down() {
        
    }

}
