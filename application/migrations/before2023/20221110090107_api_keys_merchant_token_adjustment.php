<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_api_keys_merchant_token_adjustment extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_api_keys_merchant_token_adjustment</p>");

        $this->db->query("ALTER TABLE api_keys_merchant 
CHANGE COLUMN `token` `token` VARCHAR(145) NULL DEFAULT NULL COMMENT 'Use /encrypt/generate_safe_string for generating safe tokens' ;
");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
