<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_account_donor_update extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query('ALTER TABLE `account_donor`
	ADD COLUMN `net_acum` DECIMAL(15,2) NULL DEFAULT 0.00 AFTER `fee_acum`;
');
        
        printd(get_class($this));
        
        //$this->db->query('');        
        //printd('<b>comment when adding data</b>');
        
    }

    public function down() {
        
    }

}
