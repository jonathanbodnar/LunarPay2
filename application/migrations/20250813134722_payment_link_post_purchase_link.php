<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_payment_link_post_purchase_link extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_payment_link_post_purchase_link</p>");

        $this->db->query("ALTER TABLE `payment_links` ADD `post_purchase_link` VARCHAR(255) NULL DEFAULT NULL AFTER `status`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
