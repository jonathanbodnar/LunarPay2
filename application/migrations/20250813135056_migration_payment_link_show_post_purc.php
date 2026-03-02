<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_migration_payment_link_show_post_purc extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_migration_payment_link_show_post_purc</p>");

        $this->db->query("ALTER TABLE `payment_links` ADD `show_post_purchase_link` TINYINT NULL DEFAULT NULL AFTER `status`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
