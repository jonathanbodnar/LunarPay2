<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_church_onboard_paysafe_bank_type extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_church_onboard_paysafe_bank_type</p>");
        
        $this->db->query("ALTER TABLE church_onboard_paysafe ADD bank_type varchar(100) NULL;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
