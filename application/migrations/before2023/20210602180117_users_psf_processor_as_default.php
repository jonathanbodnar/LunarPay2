<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_users_psf_processor_as_default extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_users_psf_processor_as_default</p>");

        $this->db->query("ALTER TABLE `users`
	CHANGE COLUMN `payment_processor` `payment_processor` VARCHAR(3) NULL DEFAULT 'PSF' COMMENT 'EPP: Epicpay, PSF: Paysafe' AFTER `permissions`;
");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
