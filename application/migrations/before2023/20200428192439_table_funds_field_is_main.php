<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_table_funds_field_is_main extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query('ALTER TABLE chatgive.funds ADD COLUMN `is_main` tinyint(1) DEFAULT 0;');

        printd(get_class($this) . '<br>');
        
    }

    public function down() {
        
    }

}
