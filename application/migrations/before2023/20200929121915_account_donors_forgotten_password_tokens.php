<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_account_donors_forgotten_password_tokens extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("ALTER TABLE account_donor ADD forgotten_password_selector varchar(255) DEFAULT NULL,
                            ADD forgotten_password_code varchar(255) DEFAULT NULL,
                            ADD forgotten_back_url varchar(255) DEFAULT NULL,
                            ADD forgotten_password_time int(11) unsigned DEFAULT NULL;");
        
        echo "Migration_account_donors_forgotten_password_tokens";
        
        //$this->db->query("");        
        //printd('<b>comment when adding data</b>');
        
    }

    public function down() {
        
    }

}
