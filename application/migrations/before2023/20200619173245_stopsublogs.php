<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_stopsublogs extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query('ALTER TABLE `epicpay_customer_subscriptions`
	ADD COLUMN `stopsub_request` LONGTEXT NULL DEFAULT NULL AFTER `request_response_update`,
	ADD COLUMN `stopsub_response` LONGTEXT NULL DEFAULT NULL AFTER `stopsub_request`;');
        
        printd(get_class($this));
        
        //$this->db->query('');        
        //printd('<b>comment when adding data</b>');
        
    }

    public function down() {
        
    }

}
