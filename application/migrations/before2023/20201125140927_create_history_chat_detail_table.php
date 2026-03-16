<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_create_history_chat_detail_table extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("CREATE TABLE history_chat_detail (
                        id INT UNSIGNED auto_increment NOT NULL,
                        history_chat_id INT UNSIGNED NOT NULL,
                        `type` char(1) NOT NULL COMMENT 'S Sent R Received',
                        message varchar(250) NULL,
                        chat_tree_id INT UNSIGNED NULL,
                        created_at DATETIME NOT NULL,
                        CONSTRAINT history_chat_detail_pk PRIMARY KEY (id)
                    )");
        
        echo "Migration_create_history_chat_detail_table";
        
        //$this->db->query("");        
        //printd('<b>comment when adding data</b>');
        
    }

    public function down() {
        
    }

}
