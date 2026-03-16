<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_table_account_donor_password extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query('ALTER TABLE chatgive.account_donor ADD COLUMN `password` varchar(255) NULL;');

        printd(get_class($this));
        
        //$this->db->query('');        
        //printd('<b>comment when adding data</b>');
        
    }

    public function down() {
        
    }

}
