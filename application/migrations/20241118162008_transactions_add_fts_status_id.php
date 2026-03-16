<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_transactions_add_fts_status_id extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_transactions_add_fts_status_id</p>");

        $this->db->query("ALTER TABLE `epicpay_customer_transactions` ADD `fts_status_id` INT NULL COMMENT 'Only used for tracking fts ACH status changes, for now' AFTER `status_ach`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
