<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_payment_links_campus_church_fields extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_payment_links_campus_church_fields</p>");

        $this->db->query("ALTER TABLE `payment_links`
        CHANGE `link` `hash` varchar(200) COLLATE 'utf8_general_ci' NOT NULL AFTER `client_id`,
        ADD `church_id` int NOT NULL AFTER `hash`,
        ADD `campus_id` int NOT NULL AFTER `church_id`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
