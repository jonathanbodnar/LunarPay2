<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_table_settings_chat_expiration_hours extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("INSERT INTO `settings` (`settings_id`, `type`, `description`) VALUES (6, 'chat_expiration_hours', '2');");
        
        printd(get_class($this));
        
        //$this->db->query('');        
        //printd('<b>comment when adding data</b>');
        
    }

    public function down() {
        
    }

}
