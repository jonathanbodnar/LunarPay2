<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_create_payment_links extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_create_payment_links</p>");

        $this->db->query("CREATE TABLE `payment_links` (
            `id` INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
            `product_id` INT(11) NOT NULL,
            `client_id` INT(11) NOT NULL,
            `trash` tinyint NOT NULL default 0,
            `link` varchar(200) NOT NULL,
            `created_at` DATETIME NULL DEFAULT current_timestamp(),
          INDEX `link_products_idx` (`id`, `product_id`,`client_id`)
          )ENGINE='InnoDB' COLLATE 'utf8_general_ci'");
        
        //$this->db->query("");        
        //
        
        printd('<p><b>Payment links created!</b></p>');
        
    }

    public function down() {
        
    }

}
