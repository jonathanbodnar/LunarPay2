<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_make_church_detail_paysafe_template_bigger extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_make_church_detail_paysafe_template_bigger</p>");

        $this->db->query("ALTER TABLE `church_detail`
	CHANGE COLUMN `paysafe_template` `paysafe_template` VARCHAR(128) NULL DEFAULT NULL AFTER `epicpay_template`;
");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
