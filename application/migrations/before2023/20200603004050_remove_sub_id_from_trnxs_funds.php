<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_remove_sub_id_from_trnxs_funds extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query('ALTER TABLE `transactions_funds`
	DROP COLUMN `subscription_id`;');
        
        printd(get_class($this));
        
        //$this->db->query('');        
        //printd('<b>comment when adding data</b>');
        
    }

    public function down() {
        
    }

}
