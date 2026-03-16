<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_transactions_funds_freshbooks_last_update extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_transactions_funds_freshbooks_last_update</p>");

        $this->db->query("ALTER TABLE `transactions_funds` ADD `freshbooks_last_update` DATETIME NULL DEFAULT NULL AFTER `plcenter_pushed`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
