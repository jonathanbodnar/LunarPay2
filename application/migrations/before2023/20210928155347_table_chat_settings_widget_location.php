<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_table_chat_settings_widget_location extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_table_chat_settings_widget_location</p>");

        $this->db->query("ALTER TABLE chat_settings ADD widget_position varchar(50) DEFAULT 'bottom_right' NULL;");
        $this->db->query("ALTER TABLE chat_settings ADD widget_x_adjust decimal(10,2) DEFAULT 0 NULL;");
        $this->db->query("ALTER TABLE chat_settings ADD widget_y_adjust decimal(10,2) DEFAULT 0 NULL;");

        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
