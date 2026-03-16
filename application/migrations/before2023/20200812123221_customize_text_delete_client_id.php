<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_customize_text_delete_client_id extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("ALTER TABLE `chat_customize_text`
	DROP COLUMN `client_id`;
");
        
        printd(get_class($this));
        
        //$this->db->query('');        
        //printd('<b>comment when adding data</b>');
        
    }

    public function down() {
        
    }

}
