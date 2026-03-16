<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_affiliate_table extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("
        CREATE TABLE `payment_affiliates` (
            `id` int unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
            `amount` decimal(10,2) NOT NULL DEFAULT '0.00',
            `date_created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `user_id` int NOT NULL,
            `message` varchar(255) COLLATE 'utf8_general_ci' NULL
          ) ENGINE='InnoDB' COLLATE 'utf8_general_ci';
        ");
        
        echo "Migration_affiliate_table";
        
        //$this->db->query("");        
        //printd('<b>comment when adding data</b>');
        
    }

    public function down() {
        
    }

}
