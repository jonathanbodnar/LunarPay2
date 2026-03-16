<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_sources_delete_logs extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query('ALTER TABLE `epicpay_customer_sources`
	ADD COLUMN `response_delete` TEXT NULL DEFAULT NULL AFTER `request_response_update`;
');

        printd(get_class($this));

        //$this->db->query('');        
        //printd('<b>comment when adding data</b>');
    }

    public function down() {
        
    }

}
