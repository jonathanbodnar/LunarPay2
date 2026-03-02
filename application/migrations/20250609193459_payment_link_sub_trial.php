<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_payment_link_sub_trial extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_payment_link_sub_trial</p>");

        $this->db->query("ALTER TABLE `payment_links` ADD `trial_days` INT UNSIGNED NULL DEFAULT NULL AFTER `is_internal`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
