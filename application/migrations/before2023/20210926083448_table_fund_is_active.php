<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_table_fund_is_active extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_table_fund_is_active</p>");

        $this->db->query("ALTER TABLE funds ADD is_active tinyint(1) DEFAULT 1 NULL;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
