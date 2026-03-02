<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_table_pages_conduit_fields extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_table_pages_conduit_fields</p>");

        $this->db->query("ALTER TABLE pages ADD type_page varchar(50) NULL;");
        $this->db->query("ALTER TABLE pages ADD conduit_funds varchar(1000) NULL;");


        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
