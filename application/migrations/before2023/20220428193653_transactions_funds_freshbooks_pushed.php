<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_transactions_funds_freshbooks_pushed extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_transactions_funds_freshbooks_pushed</p>");

        $this->db->query("ALTER TABLE `transactions_funds` ADD `freshbooks_pushed` CHAR(1) NULL DEFAULT NULL AFTER `freshbooks_last_update`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
