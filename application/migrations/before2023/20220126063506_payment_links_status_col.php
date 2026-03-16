<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_payment_links_status_col extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_payment_links_status_col</p>");

        $this->db->query("ALTER TABLE `payment_links`
        CHANGE `link` `link` varchar(200) COLLATE 'utf8_general_ci' NOT NULL AFTER `client_id`,
        ADD `status` tinyint NOT NULL DEFAULT '1' AFTER `link`,
        CHANGE `trash` `trash` tinyint NOT NULL DEFAULT '0' AFTER `status`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
