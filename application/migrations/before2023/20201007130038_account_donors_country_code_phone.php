<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_account_donors_country_code_phone extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("ALTER TABLE account_donor ADD country_code_phone varchar(5) DEFAULT NULL NULL;");
        $this->db->query("ALTER TABLE account_donor CHANGE country_code_phone country_code_phone varchar(5) DEFAULT NULL NULL AFTER email;");
        
        echo "Migration_account_donors_country_code_phone";
        
        //$this->db->query("");        
        //printd('<b>comment when adding data</b>');
        
    }

    public function down() {
        
    }

}
