<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_payment_link_add_payment_methods extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_payment_link_add_payment_methods</p>");

        $this->db->query("ALTER TABLE `payment_links`
        ADD `payment_methods` varchar(100) COLLATE 'utf8_general_ci' NOT NULL AFTER `status`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
