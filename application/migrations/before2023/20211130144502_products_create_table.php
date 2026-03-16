<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_products_create_table extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_products_create_table</p>");

        $this->db->query("
        CREATE TABLE `products` (
            `id` int NOT NULL AUTO_INCREMENT,
            `church_id` int DEFAULT NULL,
            `campus_id` int DEFAULT NULL,
            `name` varchar(255) DEFAULT NULL,
            `qty` int DEFAULT NULL,
            `price` int DEFAULT NULL,
            `created_at` datetime DEFAULT NULL,
            PRIMARY KEY (`id`),
            KEY `church_id` (`church_id`),
            KEY `campus_id` (`campus_id`),
            KEY `name` (`name`)
        )COLLATE='utf8_general_ci' ENGINE=InnoDB;
        ");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
