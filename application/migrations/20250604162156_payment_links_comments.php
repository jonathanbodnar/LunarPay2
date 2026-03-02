<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_payment_links_comments extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_payment_links_comments</p>");

        $this->db->query("ALTER TABLE `payment_links` CHANGE `customer_id` `customer_id` INT(11) NULL DEFAULT NULL COMMENT 'Included when the payment link is created by a final customer';");
        $this->db->query("ALTER TABLE `payment_links` CHANGE `customer_email` `customer_email` VARCHAR(128) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT 'Included when the payment link is created by a final customer';");
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
