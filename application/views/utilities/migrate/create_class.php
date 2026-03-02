<?php

echo '<?php 
    
defined(\'BASEPATH\') OR exit(\'No direct script access allowed\');

class ' . $class_name . ' extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>' . $class_name . '</p>");

        $this->db->query("");
        
        //$this->db->query("");        
        //printd(\'<p><b>comment when adding data</b></p>\');
        
    }

    public function down() {
        
    }

}
';
