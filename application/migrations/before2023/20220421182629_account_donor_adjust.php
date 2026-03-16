<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_account_donor_adjust extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_account_donor_adjust</p>");

        $this->db->query("ALTER TABLE `account_donor` CHANGE `stripe_customer_id` `stripe_customer_id` TEXT CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
