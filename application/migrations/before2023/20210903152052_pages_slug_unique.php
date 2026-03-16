<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_pages_slug_unique extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_pages_slug_unique</p>");

        $this->db->query("ALTER TABLE `pages`
	ADD UNIQUE INDEX `slug` (`slug`);
");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
