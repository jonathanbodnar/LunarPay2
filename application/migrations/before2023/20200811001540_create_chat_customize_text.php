<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_create_chat_customize_text extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query('CREATE TABLE chatgive.chat_customize_text (
        id INT(11) auto_increment NOT NULL,
        client_id INT(11) NOT NULL,
        church_id INT(11) NOT NULL,
        campus_id int(11) NULL,
        chat_tree_id int(11) NOT NULL,
        customize_text text NULL,
        CONSTRAINT chat_customize_text_pk PRIMARY KEY (id)
        )ENGINE=InnoDB;');
        
        printd(get_class($this));
        
        //$this->db->query('');        
        //printd('<b>comment when adding data</b>');
        
    }

    public function down() {
        
    }

}
