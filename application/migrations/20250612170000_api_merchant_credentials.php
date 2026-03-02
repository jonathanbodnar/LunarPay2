<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_api_merchant_credentials extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_api_merchant_credentials</p>");

        $this->db->query("CREATE TABLE `api_merchant_credentials` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `client_id` VARCHAR(100) NOT NULL,
  `api_key` VARCHAR(255) NOT NULL,
  `api_secret_hash` VARCHAR(255) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),    
  KEY `idx_api_key` (`api_key`)
) ENGINE=InnoDB;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
