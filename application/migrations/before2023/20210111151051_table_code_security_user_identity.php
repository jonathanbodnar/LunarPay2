<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_table_code_security_user_identity extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up()
    {

        $this->db->query("ALTER TABLE code_security CHANGE mobile user_identity varchar(256) DEFAULT NULL NULL;");
        $this->db->query("ALTER TABLE code_security MODIFY COLUMN user_identity varchar(256) DEFAULT NULL NULL;");
            
        echo "<p>Migration_table_code_security_user_identity</p>";
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
