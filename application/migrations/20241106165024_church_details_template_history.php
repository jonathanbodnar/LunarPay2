<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_church_details_template_history extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_church_details_template_history</p>");

        $this->db->query("ALTER TABLE `church_detail` CHANGE `epicpay_template_history` `template_history` LONGTEXT CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
