<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_users_stripesustomersid extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_users_stripesustomersid</p>");

        $this->db->query("ALTER TABLE `account_donor` ADD `stripe_customer_id` VARCHAR(20) NOT NULL AFTER `id_church`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
