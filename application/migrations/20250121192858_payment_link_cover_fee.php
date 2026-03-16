<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_payment_link_cover_fee extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_payment_link_cover_fee</p>");

        $this->db->query("ALTER TABLE `payment_links` ADD `cover_fee` TINYINT(4) NULL DEFAULT NULL AFTER `payment_methods`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
