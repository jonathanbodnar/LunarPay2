<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_create_history_chat_table extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("CREATE TABLE history_chat (
                            id INT UNSIGNED auto_increment NOT NULL,
                            donor_id INT UNSIGNED NULL,
                            church_id INT UNSIGNED NOT NULL,
                            campus_id INT UNSIGNED NULL,
                            session_id varchar(200) NOT NULL,
                            status char(1) NOT NULL COMMENT 'O open A archive C close',
                            created_at DATETIME NOT NULL,
                            CONSTRAINT history_chat_pk PRIMARY KEY (id)
                        )");
        
        echo "Migration_create_history_chat_table";
        
        //$this->db->query("");        
        //printd('<b>comment when adding data</b>');
        
    }

    public function down() {
        
    }

}
