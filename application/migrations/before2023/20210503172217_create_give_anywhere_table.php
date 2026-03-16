<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_create_give_anywhere_table extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_create_give_anywhere_table</p>");

        $this->db->query("CREATE TABLE give_anywhere (
                        id int(11) auto_increment NOT NULL,
                        church_id int(11) NULL,
                        campus_id int(11) NULL,
                        client_id int(11) NULL,
                        button_color varchar(20) NULL,
                        text_color varchar(20) NULL,
                        button_text varchar(50) NULL,
                        created_at datetime NULL,
                        CONSTRAINT give_anywhere_pk PRIMARY KEY (id)
                    )");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
