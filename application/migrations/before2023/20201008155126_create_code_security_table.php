<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_create_code_security_table extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("CREATE TABLE `code_security` (
                    `id` INT(11) NOT NULL AUTO_INCREMENT,
                    `mobile` VARCHAR(20) NULL DEFAULT NULL,
                    `code` VARCHAR(6) NULL DEFAULT NULL,
                    PRIMARY KEY (`id`)
                )");
        
        echo "Migration_create_code_security_table";
        
        //$this->db->query("");        
        //printd('<b>comment when adding data</b>');
        
    }

    public function down() {
        
    }

}
