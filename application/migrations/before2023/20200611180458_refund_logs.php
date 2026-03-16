<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_refund_logs extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query('ALTER TABLE `epicpay_customer_transactions`
	ADD COLUMN `refund_request` LONGTEXT NULL DEFAULT NULL AFTER `request_response`,
	ADD COLUMN `refund_response` LONGTEXT NULL DEFAULT NULL AFTER `refund_request`;
');
        
        printd(get_class($this));
        
        //$this->db->query('');        
        //printd('<b>comment when adding data</b>');
        
    }

    public function down() {
        
    }

}
