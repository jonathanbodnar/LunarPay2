<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_log_fund_names_on_transactionsfunds extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_log_fund_names_on_transactionsfunds</p>");

        $this->db->query("ALTER TABLE `transactions_funds`
	ADD COLUMN `fund_name` VARCHAR(128) NULL DEFAULT NULL AFTER `net`;
");
        $this->db->query("ALTER TABLE `transactions_funds`
	CHANGE COLUMN `fund_name` `fund_name` VARCHAR(128) NULL DEFAULT NULL COMMENT 'Log the original fund name to keep it even if the admin changes it in the future' AFTER `net`;
");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
