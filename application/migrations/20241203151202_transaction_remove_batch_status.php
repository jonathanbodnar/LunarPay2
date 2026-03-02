<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_transaction_remove_batch_status extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_transaction_remove_batch_status</p>");

        $this->db->query("ALTER TABLE `epicpay_customer_transactions` DROP `batch_status_id`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
