<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_account_donor_quickbooks_id_user extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_account_donor_quickbooks_id_user</p>");

        $this->db->query("ALTER TABLE `account_donor` ADD `quickbooks_id_user` VARCHAR(20) NULL DEFAULT NULL AFTER `freshbooks_id_user`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
