<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_transactions_funds_autoincrement extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query('ALTER TABLE chatgive.transactions_funds MODIFY COLUMN id int(11) unsigned auto_increment NOT NULL; ');
        
        printd(get_class($this));
    }

    public function down() {
        
    }

}
