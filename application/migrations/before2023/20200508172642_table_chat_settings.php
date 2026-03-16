<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_table_chat_settings extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("CREATE TABLE `chat_settings` (
                `id` INT(11) NOT NULL AUTO_INCREMENT,
                `client_id` INT(11) NOT NULL,
                `church_id` INT(11) NOT NULL,
                `campus_id` INT(11) NULL DEFAULT NULL,
                `logo` TEXT NULL DEFAULT NULL,
                `theme_color` VARCHAR(20)  NULL DEFAULT NULL,
                `button_text_color` VARCHAR(20)  NULL DEFAULT NULL,
                PRIMARY KEY (`id`)
            )
            ENGINE=InnoDB
        ;
        ");
        
        printd(get_class($this));
        
        //$this->db->query('');        
        //printd('<b>comment when adding data</b>');
        
    }

    public function down() {
        
    }

}
