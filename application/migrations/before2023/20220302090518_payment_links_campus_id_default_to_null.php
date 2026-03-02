<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_payment_links_campus_id_default_to_null extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_payment_links_campus_id_default_to_null</p>");

        $this->db->query("ALTER TABLE `payment_links`
	CHANGE COLUMN `campus_id` `campus_id` INT(11) NULL DEFAULT NULL AFTER `church_id`;
");
        
        $this->db->query("UPDATE payment_links SET campus_id = NULL WHERE campus_id = 0;");        
        printd('<p><b>set current campus_id zeros to null</b></p>');
        
    }

    public function down() {
        
    }

}
