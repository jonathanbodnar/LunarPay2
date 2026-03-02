<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_funds_remove_is_main extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_funds_remove_is_main</p>");

        $this->db->query("ALTER TABLE `funds`
	DROP COLUMN `is_main`;
");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
